import axios from "axios";
import Cookies from "js-cookie";

const generateDeviceId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
};

const getOrCreateDeviceId = () => {
    let deviceId = Cookies.get("deviceId");
    if (!deviceId) {
        deviceId = generateDeviceId();
        Cookies.set("deviceId", deviceId);
    }
    return deviceId;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL!;

export const apiBase = () => {
    const deviceId = getOrCreateDeviceId();
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "X-Device-ID": deviceId,
        },
    });
};

export const authApiBase = () => {
    const token = Cookies.get("token");
    const sessionId = Cookies.get("sessionId");
    const deviceId = getOrCreateDeviceId();
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Session-ID": sessionId,
            "X-Device-ID": deviceId,
        },
    });
};
