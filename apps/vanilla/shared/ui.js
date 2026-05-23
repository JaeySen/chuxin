import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  ensureUserDoc,
} from "./firebase.js";

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function toast(msg, kind = "info") {
  let bar = $("#hanai-toast");
  if (!bar) {
    bar = el("div", { id: "hanai-toast" });
    document.body.appendChild(bar);
  }
  bar.textContent = msg;
  bar.className = `toast toast-${kind} show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => bar.classList.remove("show"), 2200);
}

export function mountHeader(rootSel = "#hanai-header") {
  const root = $(rootSel);
  if (!root) return;
  root.innerHTML = `
    <div class="hanai-header-inner">
      <a class="brand" href="/">
        <span class="brand-logo">汉</span>
        <span>Chuxin</span>
      </a>
      <nav class="hanai-nav">
        <a href="/">Khoá học</a>
        <a href="/me.html">Tiến độ</a>
      </nav>
      <div class="hanai-auth" id="hanai-auth">
        <button class="btn btn-ghost" id="hanai-signin-btn">Đăng nhập</button>
      </div>
    </div>
  `;

  onAuthStateChanged(auth, async (user) => {
    if (user) await ensureUserDoc(user);
    const slot = $("#hanai-auth");
    slot.innerHTML = "";
    if (user) {
      const name = user.displayName || user.email || "Học viên";
      slot.appendChild(
        el(
          "div",
          { class: "hanai-user" },
          el("span", { class: "hanai-user-name" }, name),
          el(
            "button",
            {
              class: "btn btn-ghost btn-sm",
              onClick: () => signOut(auth),
            },
            "Đăng xuất",
          ),
        ),
      );
    } else {
      const btn = el(
        "button",
        { class: "btn btn-primary btn-sm", id: "hanai-signin-btn" },
        "Đăng nhập",
      );
      btn.addEventListener("click", () => openSignInModal());
      slot.appendChild(btn);
    }
  });
}

function openSignInModal() {
  if ($("#hanai-signin-modal")) return;
  const modal = el(
    "div",
    { id: "hanai-signin-modal", class: "hanai-modal" },
    el(
      "div",
      { class: "hanai-modal-card" },
      el("h3", {}, "Đăng nhập"),
      el(
        "button",
        {
          class: "btn btn-google",
          onClick: async () => {
            try {
              await signInWithPopup(auth, googleProvider);
              modal.remove();
            } catch (e) {
              toast(e.message, "error");
            }
          },
        },
        "Đăng nhập bằng Google",
      ),
      el("div", { class: "divider" }, "hoặc dùng email"),
      el("input", { id: "signin-email", type: "email", placeholder: "Email" }),
      el("input", { id: "signin-pw", type: "password", placeholder: "Mật khẩu" }),
      el(
        "div",
        { class: "row gap" },
        el(
          "button",
          {
            class: "btn btn-primary",
            onClick: async () => {
              const email = $("#signin-email").value.trim();
              const pw = $("#signin-pw").value;
              try {
                await signInWithEmailAndPassword(auth, email, pw);
                modal.remove();
              } catch (e) {
                toast(e.message, "error");
              }
            },
          },
          "Đăng nhập",
        ),
        el(
          "button",
          {
            class: "btn btn-ghost",
            onClick: async () => {
              const email = $("#signin-email").value.trim();
              const pw = $("#signin-pw").value;
              try {
                await createUserWithEmailAndPassword(auth, email, pw);
                modal.remove();
              } catch (e) {
                toast(e.message, "error");
              }
            },
          },
          "Tạo tài khoản",
        ),
      ),
      el(
        "button",
        {
          class: "btn btn-text close-x",
          onClick: () => modal.remove(),
        },
        "Đóng",
      ),
    ),
  );
  document.body.appendChild(modal);
}

export function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) callback(user);
    else openSignInModal();
  });
}

export function audioPlayer(url) {
  const audio = new Audio(url);
  audio.preload = "auto";
  const wrap = el(
    "div",
    { class: "hanai-audio" },
    el(
      "button",
      {
        class: "btn btn-audio",
        type: "button",
        onClick: () => {
          if (audio.paused) audio.play().catch(() => {});
          else audio.pause();
        },
      },
      "▶︎ Nghe",
    ),
  );
  return { wrap, audio };
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
