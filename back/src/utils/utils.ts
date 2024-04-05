
export const uniqid = (prefix = "", random = false) => {
    const sec = Date.now() * 1000 + Math.random() * 1000;
    const id = sec.toString(16).replace(/\./g, "").padEnd(14, "0");
    return `${prefix}_${id}${random ? `.${Math.trunc(Math.random() * 100000000)}`:""}`;
};