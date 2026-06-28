const pingValue = document.getElementById("pingValue");
const jitterValue = document.getElementById("jitterValue");
const downloadValue = document.getElementById("downloadValue");
const uploadValue = document.getElementById("uploadValue");
const statusTitle = document.getElementById("statusTitle");
const ringValue = document.getElementById("ringValue");
const ringValueNumber = document.querySelector(".ring-value-number");
const ringValueUnit = document.querySelector(".ring-value-unit");
const statusCaption = document.getElementById("statusCaption");
const statusRing = document.querySelector(".status-ring");
const startButton = document.getElementById("startButton");

const config = {
  pingPath: "upload?cache=",
  downloadPath: "downloading",
  uploadPath: "upload",
  durationSeconds: 10,
  downloadThreads: 3,
  uploadThreads: 3,
  uploadSizeMB: 4,
};

let isRunning = false;
let stopRequested = false;
let activeXhrs = [];

function setState(title, caption, valueText, valueClass = "ring-value--small", unitText = "") {
  statusTitle.innerHTML = `<i class="fa-solid fa-gauge-high"></i> ${title}`;
  if (statusCaption) {
    statusCaption.textContent = caption;
  }

  if (ringValueNumber) {
    ringValueNumber.textContent = valueText;
  } else if (ringValue) {
    ringValue.textContent = valueText;
  }

  if (ringValueUnit) {
    ringValueUnit.textContent = unitText;
  }

  ringValue?.classList.remove("ring-value--compact", "ring-value--small");
  ringValue?.classList.add(valueClass);
}

function bytesToMbps(bytes, seconds) {
  const duration = Math.max(seconds, 0.001);
  return Math.round(((bytes * 8) / 1_000_000 / duration) * 10) / 10;
}

function xhrTransfer(url, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    activeXhrs.push(xhr);

    const removeXhr = () => {
      const index = activeXhrs.indexOf(xhr);
      if (index !== -1) {
        activeXhrs.splice(index, 1);
      }
    };

    xhr.open(method, url, true);
    xhr.responseType = "arraybuffer";
    const start = performance.now();

    xhr.onload = () => {
      removeXhr();
      const duration = (performance.now() - start) / 1000;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          duration,
          bytes: body ? body.byteLength : xhr.response ? xhr.response.byteLength : 0,
        });
      } else {
        reject(new Error(`Server antwortete mit ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      removeXhr();
      reject(new Error("Netzwerkfehler"));
    };
    xhr.onabort = () => {
      removeXhr();
      reject(new Error("Übertragung abgebrochen"));
    };

    try {
      xhr.send(body);
    } catch (error) {
      removeXhr();
      reject(error);
    }
  });
}

async function measurePingSeconds(seconds, onUpdate) {
  const endTime = performance.now() + seconds * 1000;
  const values = [];

  while (performance.now() < endTime) {
    const result = await xhrTransfer(`${config.pingPath}${Date.now()}`);
    const ms = Math.round(result.duration * 1000);
    values.push(ms);
    const caption = `Ping-Messung (${Math.max(1, Math.ceil((endTime - performance.now()) / 1000))}s verbleibend)`;
    setState("PING", caption, `${ms}`, "ring-value--compact", "ms");
    onUpdate?.(ms);
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function measureJitterSeconds(seconds, onUpdate) {
  const endTime = performance.now() + seconds * 1000;
  const values = [];

  while (performance.now() < endTime) {
    const result = await xhrTransfer(`${config.pingPath}${Date.now()}`);
    const ms = Math.round(result.duration * 1000);
    values.push(ms);

    if (values.length > 1) {
      const jitter = Math.round(
        values
          .slice(1)
          .reduce((sum, value, index) => sum + Math.abs(value - values[index]), 0) /
          (values.length - 1)
      );
      const caption = `Jitter-Messung (${Math.max(1, Math.ceil((endTime - performance.now()) / 1000))}s verbleibend)`;
      setState("JITTER", caption, `${jitter}`, "ring-value--compact", "ms");
      onUpdate?.(jitter);
    } else {
      setState("JITTER", `Jitter-Messung (${Math.max(1, Math.ceil((endTime - performance.now()) / 1000))}s verbleibend)`, `--`, "ring-value--compact", "ms");
    }
  }

  if (values.length <= 1) {
    return 0;
  }

  return Math.round(
    values
      .slice(1)
      .reduce((sum, value, index) => sum + Math.abs(value - values[index]), 0) /
      (values.length - 1)
  );
}

async function measureThroughputSeconds(seconds, threads, createRequest, onUpdate) {
  const endTime = performance.now() + seconds * 1000;
  const startedAt = performance.now();
  let totalBytes = 0;

  const workers = Array.from({ length: threads }, async () => {
    while (performance.now() < endTime) {
      const result = await createRequest();
      totalBytes += result.bytes;
      const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
      onUpdate?.(bytesToMbps(totalBytes, elapsedSeconds));
    }
  });

  await Promise.all(workers);
  const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
  return bytesToMbps(totalBytes, elapsedSeconds);
}

async function runSpeedtest() {
  isRunning = true;
  stopRequested = false;
  updateButton();
  startButton.disabled = false;
  statusRing?.classList.add("status-ring--spinning");
  setState("TEST", "Starte Test: Ping, Jitter, Download, Upload.", "START", "ring-value--small");
  pingValue.textContent = "--";
  jitterValue.textContent = "--";
  downloadValue.textContent = "--";
  uploadValue.textContent = "--";

  try {
    const ping = await measurePingSeconds(config.durationSeconds, (latest) => {
      setState("PING", `Ping-Messung (${Math.max(1, config.durationSeconds)}s)`, `${latest}`, "ring-value--compact", "ms");
    });
    pingValue.textContent = ping;

    const jitter = await measureJitterSeconds(config.durationSeconds, (latest) => {
      setState("JITTER", `Jitter-Messung (${Math.max(1, config.durationSeconds)}s)`, `${latest}`, "ring-value--compact", "ms");
    });
    jitterValue.textContent = jitter;

    const download = await measureThroughputSeconds(
      config.durationSeconds,
      config.downloadThreads,
      () => xhrTransfer(config.downloadPath, "GET"),
      (latest) => {
        setState("DOWNLOAD", `Download-Messung (${Math.max(1, config.durationSeconds)}s)`, `${latest}`, "ring-value--compact", "Mbps");
      }
    );
    downloadValue.textContent = download;

    const upload = await measureThroughputSeconds(
      config.durationSeconds,
      config.uploadThreads,
      () => {
        const uploadData = new Uint8Array(config.uploadSizeMB * 1024 * 1024);
        return xhrTransfer(config.uploadPath, "POST", uploadData);
      },
      (latest) => {
        setState("UPLOAD", `Upload-Messung (${Math.max(1, config.durationSeconds)}s)`, `${latest}`, "ring-value--compact", "Mbps");
      }
    );
    uploadValue.textContent = upload;

    setState("ERFOLG", "Messung abgeschlossen.", "FERTIG", "ring-value--small", "");
  } catch (error) {
    if (!stopRequested) {
      setState("FEHLER", error.message, "ERR", "ring-value--small", "");
    }
  } finally {
    statusRing?.classList.remove("status-ring--spinning");
    isRunning = false;
    stopRequested = false;
    updateButton();
    startButton.disabled = false;
  }
}

function resetUI() {
  setState("READY", "", "LOS", "ring-value--small", "");
  pingValue.textContent = "--";
  jitterValue.textContent = "--";
  downloadValue.textContent = "--";
  uploadValue.textContent = "--";
  statusRing?.classList.remove("status-ring--spinning");
}

function stopTest() {
  stopRequested = true;
  while (activeXhrs.length) {
    const xhr = activeXhrs.pop();
    xhr.abort();
  }
  resetUI();
}

function updateButton() {
  if (isRunning) {
    startButton.innerHTML = '<i class="fa-solid fa-square"></i> STOP';
  } else {
    startButton.innerHTML = '<i class="fa-solid fa-play"></i> START';
  }
}

startButton.addEventListener("click", () => {
  if (isRunning) {
    stopTest();
  } else {
    runSpeedtest();
  }
});
