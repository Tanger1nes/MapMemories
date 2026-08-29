"use client";

import { useState } from "react";
import styles from "./LoginModal.module.css";

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      onLogin({ username: registerUsername, email: registerEmail, password: registerPassword });
    } else {
      onLogin({ email: loginEmail, password: loginPassword });
    }
    setLoginEmail("");
    setLoginPassword("");
    setRegisterUsername("");
    setRegisterEmail("");
    setRegisterPassword("");
    setIsRegister(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 className={styles.title}>🗺️ MapMemories</h2>
        <p className={styles.subtitle}>
          {isRegister ? "Buat akun baru" : "Masuk ke akun Anda"}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isRegister && (
            <input
              type="text"
              placeholder="Username"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              className={styles.input}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={isRegister ? registerEmail : loginEmail}
            onChange={(e) =>
              isRegister
                ? setRegisterEmail(e.target.value)
                : setLoginEmail(e.target.value)
            }
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={isRegister ? registerPassword : loginPassword}
            onChange={(e) =>
              isRegister
                ? setRegisterPassword(e.target.value)
                : setLoginPassword(e.target.value)
            }
            className={styles.input}
            required
          />
          <button type="submit" className={styles.submitBtn}>
            {isRegister ? "Daftar" : "Masuk"}
          </button>
        </form>

        <p className={styles.switch}>
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}
          <span onClick={() => setIsRegister(!isRegister)} className={styles.switchLink}>
            {isRegister ? " Masuk" : " Daftar"}
          </span>
        </p>
      </div>
    </div>
  );
}