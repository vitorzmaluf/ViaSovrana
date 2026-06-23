const header = document.querySelector(".site-header");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const links = document.querySelectorAll(".nav-links a[href^='#']");
const sections = document.querySelectorAll("main section[id]");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 12);
});

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.classList.toggle("open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

links.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeId = entry.target.getAttribute("id");
      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
      });
    });
  },
  { rootMargin: "-35% 0px -58% 0px", threshold: 0 }
);

sections.forEach((section) => observer.observe(section));

const quoteForm = document.getElementById("quoteForm");
const formMessage = document.getElementById("formMessage");

const API_BASE = "https://darkorchid-bison-969577.hostingersite.com";
const WHATSAPP_PHONE = "5511999999999";

function buildWhatsappMessage(data) {
  return [
    "Olá, gostaria de solicitar uma cotação com a Via Sovrana.",
    "",
    `Nome: ${data.nome || "-"}`,
    `Empresa: ${data.empresa || "-"}`,
    `WhatsApp: ${data.whatsapp || "-"}`,
    `E-mail: ${data.email || "-"}`,
    "",
    `Origem: ${data.origem || "-"}`,
    `Destino: ${data.destino || "-"}`,
    `Tipo de carga: ${data.carga || "-"}`,
    `Prazo desejado: ${data.prazo || "-"}`,
    `Peso aproximado: ${data.peso || "-"} kg`,
    `Observações: ${data.observacoes || "-"}`
  ].join("\n");
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(quoteForm).entries());

    const message = buildWhatsappMessage(data);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

    // Abre a aba imediatamente para evitar bloqueio de popup
    const whatsappWindow = window.open("", "_blank");

    try {
      formMessage.textContent = "Enviando cotação...";

      const response = await fetch(`${API_BASE}/api/leads/site-cotacao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Erro ao enviar cotação.");
      }

      formMessage.textContent = "Cotação enviada com sucesso. Abrindo WhatsApp...";

      quoteForm.reset();
    } catch (error) {
      console.error(error);
      formMessage.textContent = "Não foi possível enviar o e-mail agora. Abrindo WhatsApp para contato direto.";
    }

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappUrl;
    } else {
      window.location.href = whatsappUrl;
    }
  });
}
