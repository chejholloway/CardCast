const writeLog = (fields) => {
    const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...fields
    });
    // eslint-disable-next-line no-console
    console.log(line);
};
export const log = {
    debug: (msg, extra) => writeLog({ level: "debug", msg, ...extra }),
    info: (msg, extra) => writeLog({ level: "info", msg, ...extra }),
    warn: (msg, extra) => writeLog({ level: "warn", msg, ...extra }),
    error: (msg, extra) => writeLog({ level: "error", msg, ...extra })
};
