type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

const writeLog = (fields: LogFields) => {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...fields
  });
  // eslint-disable-next-line no-console
  console.log(line);
};

export const log = {
  debug: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: "debug", msg, ...extra }),
  info: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: "info", msg, ...extra }),
  warn: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: "warn", msg, ...extra }),
  error: (msg: string, extra?: Record<string, unknown>) =>
    writeLog({ level: "error", msg, ...extra })
};

