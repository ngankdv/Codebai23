/**
 * HỆ THỐNG XỬ LÝ XÁC THỰC NGƯỜI DÙNG (CLIENT-SIDE)
 * Bao gồm: Chuyển đổi Tab, Dark/Light Mode, Kiểm tra mật khẩu, Validation & Toast
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ========================================================================
     1. KHỞI TẠO CÁC PHẦN TỬ DOM
     ======================================================================== */
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");

  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabIndicator = document.getElementById("tab-indicator");
  const authTabsContainer = document.querySelector(".auth-tabs");
  const forms = document.querySelectorAll(".auth-form");

  const gotoForgotBtn = document.getElementById("goto-forgot-btn");
  const backToLoginBtn = document.getElementById("back-to-login-btn");

  const loginForm = document.getElementById("login-panel");
  const registerForm = document.getElementById("register-panel");
  const forgotForm = document.getElementById("forgot-panel");

  const regPasswordInput = document.getElementById("reg-password");
  const strengthBars = [
    document.getElementById("bar-1"),
    document.getElementById("bar-2"),
    document.getElementById("bar-3"),
    document.getElementById("bar-4"),
  ];
  const strengthLabel = document.getElementById("strength-label");
  const criteriaItems = document.querySelectorAll("#password-criteria li");

  /* ========================================================================
     2. QUẢN LÝ CHẾ ĐỘ SÁNG / TỐI (THEME SYSTEM)
     ======================================================================== */
  const savedTheme = localStorage.getItem("nova_auth_theme") || "dark";
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = htmlEl.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem("nova_auth_theme", nextTheme);
    showToast(
      `Đã chuyển sang giao diện ${nextTheme === "dark" ? "Tối" : "Sáng"}`,
      "info"
    );
  });

  function applyTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    if (theme === "dark") {
      themeIcon.textContent = "☀️";
      themeText.textContent = "Chế độ Sáng";
    } else {
      themeIcon.textContent = "🌙";
      themeText.textContent = "Chế độ Tối";
    }
  }

  /* ========================================================================
     3. CHUYỂN ĐỔI QUA LẠI GIỮA CÁC TAB (LOGIN / REGISTER / FORGOT)
     ======================================================================== */
  function switchPanel(targetId) {
    forms.forEach((form) => {
      form.classList.toggle("active", form.id === targetId);
    });

    if (targetId === "forgot-panel") {
      authTabsContainer.style.display = "none";
    } else {
      authTabsContainer.style.display = "grid";
      tabButtons.forEach((btn, index) => {
        const isTarget = btn.getAttribute("data-target") === targetId;
        btn.classList.toggle("active", isTarget);
        btn.setAttribute("aria-selected", isTarget);
        if (isTarget) {
          tabIndicator.style.transform = `translateX(${index * 100}%)`;
        }
      });
    }
    clearAllErrors();
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      switchPanel(targetId);
    });
  });

  gotoForgotBtn.addEventListener("click", () => switchPanel("forgot-panel"));
  backToLoginBtn.addEventListener("click", () => switchPanel("login-panel"));

  /* ========================================================================
     4. ẨN / HIỆN MẬT KHẨU & PHÁT HIỆN PHÍM CAPS LOCK
     ======================================================================== */
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetInput = document.getElementById(btn.getAttribute("data-target"));
      if (!targetInput) return;

      const isPassword = targetInput.type === "password";
      targetInput.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "🙈" : "👁️";
    });
  });

  function bindCapsLockWarning(inputId, warningId) {
    const inputEl = document.getElementById(inputId);
    const warningEl = document.getElementById(warningId);
    if (!inputEl || !warningEl) return;

    const checkCaps = (event) => {
      if (typeof event.getModifierState === "function") {
        const isCapsOn = event.getModifierState("CapsLock");
        warningEl.classList.toggle("visible", isCapsOn);
      }
    };

    inputEl.addEventListener("keyup", checkCaps);
    inputEl.addEventListener("keydown", checkCaps);
    inputEl.addEventListener("blur", () => warningEl.classList.remove("visible"));
  }

  bindCapsLockWarning("login-password", "login-caps-warning");
  bindCapsLockWarning("reg-password", "reg-caps-warning");

  /* ========================================================================
     5. ĐÁNH GIÁ ĐỘ MẠNH MẬT KHẨU THEO THỜI GIAN THỰC
     ======================================================================== */
  regPasswordInput.addEventListener("input", () => {
    const val = regPasswordInput.value;
    const rules = {
      length: val.length >= 8,
      uppercase: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val),
    };

    let score = 0;
    criteriaItems.forEach((item) => {
      const ruleName = item.getAttribute("data-rule");
      const isMet = rules[ruleName];
      item.classList.toggle("met", isMet);
      if (isMet) score++;
    });

    const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
    const labels = ["Rất yếu", "Trung bình", "Khá mạnh", "Tuyệt vời"];

    strengthBars.forEach((bar, idx) => {
      if (idx < score) {
        bar.style.backgroundColor = colors[score - 1];
      } else {
        bar.style.backgroundColor = "var(--border-color)";
      }
    });

    strengthLabel.textContent =
      val.length === 0 ? "Độ mạnh: Chưa nhập" : `Độ mạnh: ${labels[score - 1] || "Rất yếu"}`;
  });

  /* ========================================================================
     6. CÁC HÀM HỖ TRỢ KIỂM TRA DỮ LIỆU (VALIDATION HELPERS)
     ======================================================================== */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function setFieldError(inputId, errorId, message) {
    const inputEl = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (inputEl) inputEl.classList.add("input-error");
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(inputId, errorId) {
    const inputEl = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (inputEl) inputEl.classList.remove("input-error");
    if (errorEl) errorEl.textContent = "";
  }

  function clearAllErrors() {
    document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
    document.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
  }

  function triggerShake(formEl) {
    formEl.classList.remove("shake");
    void formEl.offsetWidth; // Force reflow
    formEl.classList.add("shake");
  }

  /* ========================================================================
     7. XỬ LÝ SUBMIT FORM ĐĂNG NHẬP, ĐĂNG KÝ & QUÊN MẬT KHẨU
     ======================================================================== */
  function simulateAsyncSubmit(buttonEl, callback) {
    buttonEl.classList.add("loading");
    buttonEl.disabled = true;
    setTimeout(() => {
      buttonEl.classList.remove("loading");
      buttonEl.disabled = false;
      callback();
    }, 1200);
  }

  // Xử lý Đăng nhập
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    let isValid = true;

    if (!isValidEmail(email)) {
      setFieldError("login-email", "login-email-error", "Vui lòng nhập địa chỉ email hợp lệ.");
      isValid = false;
    }

    if (password.length < 6) {
      setFieldError(
        "login-password",
        "login-password-error",
        "Mật khẩu phải có ít nhất 6 ký tự."
      );
      isValid = false;
    }

    if (!isValid) {
      triggerShake(loginForm);
      showToast("Vui lòng kiểm tra lại thông tin đăng nhập!", "error");
      return;
    }

    const submitBtn = document.getElementById("login-submit-btn");
    simulateAsyncSubmit(submitBtn, () => {
      showToast(`Đăng nhập thành công! Xin chào ${email}`, "success");
      loginForm.reset();
    });
  });

  // Xử lý Đăng ký
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const fullname = document.getElementById("reg-fullname").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = regPasswordInput.value;
    const confirm = document.getElementById("reg-confirm").value;
    const termsChecked = document.getElementById("reg-terms").checked;

    let isValid = true;

    if (fullname.length < 3) {
      setFieldError("reg-fullname", "reg-fullname-error", "Họ và tên phải có ít nhất 3 ký tự.");
      isValid = false;
    }

    if (!isValidEmail(email)) {
      setFieldError("reg-email", "reg-email-error", "Địa chỉ email không đúng định dạng.");
      isValid = false;
    }

    if (password.length < 8) {
      setFieldError("reg-password", "reg-password-error", "Mật khẩu phải từ 8 ký tự trở lên.");
      isValid = false;
    }

    if (confirm !== password || confirm === "") {
      setFieldError("reg-confirm", "reg-confirm-error", "Mật khẩu xác nhận không khớp.");
      isValid = false;
    }

    if (!termsChecked) {
      document.getElementById("reg-terms-error").textContent =
        "Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục.";
      isValid = false;
    }

    if (!isValid) {
      triggerShake(registerForm);
      showToast("Thông tin đăng ký chưa hợp lệ!", "error");
      return;
    }

    const submitBtn = document.getElementById("register-submit-btn");
    simulateAsyncSubmit(submitBtn, () => {
      showToast("Tạo tài khoản thành công! Hãy đăng nhập.", "success");
      registerForm.reset();
      regPasswordInput.dispatchEvent(new Event("input"));
      switchPanel("login-panel");
    });
  });

  // Xử lý Quên mật khẩu
  forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById("forgot-email").value;
    if (!isValidEmail(email)) {
      setFieldError("forgot-email", "forgot-email-error", "Vui lòng nhập email hợp lệ.");
      triggerShake(forgotForm);
      return;
    }

    const submitBtn = document.getElementById("forgot-submit-btn");
    simulateAsyncSubmit(submitBtn, () => {
      showToast(`Đã gửi liên kết khôi phục tới ${email}`, "success");
      forgotForm.reset();
      switchPanel("login-panel");
    });
  });

  // Các nút mạng xã hội
  document.querySelectorAll(".btn-social").forEach((btn) => {
    btn.addEventListener("click", () => {
      const provider = btn.getAttribute("data-provider");
      showToast(`Đang kết nối với cổng xác thực ${provider}...`, "info");
    });
  });

  /* ========================================================================
     8. HỆ THỐNG HIỂN THỊ THÔNG BÁO TOAST
     ======================================================================== */
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" style="background:none;border:none;color:inherit;cursor:pointer;font-weight:bold;">✕</button>
    `;

    toast.querySelector("button").addEventListener("click", () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 4000);
  }
});