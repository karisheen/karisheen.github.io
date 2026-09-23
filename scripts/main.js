(() => {
  "use strict";

  const projectItems = [...document.querySelectorAll("[data-categories]")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const archive = document.querySelector("#project-archive");
  const projectCount = document.querySelector("#project-count");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function filterProjects(category) {
    let count = 0;
    for (const project of projectItems) {
      const shouldShow =
        category === "all" ||
        project.dataset.categories.split(" ").includes(category);
      const wasHidden = project.hidden;
      for (const animation of project.getAnimations()) animation.cancel();
      project.hidden = !shouldShow;
      if (shouldShow) {
        count++;
        if (wasHidden) {
          project.animate(
            reduceMotion
              ? [{ opacity: 0.75 }, { opacity: 1 }]
              : [
                  { opacity: 0.6, transform: "translateY(4px)" },
                  { opacity: 1, transform: "translateY(0)" },
                ],
            {
              duration: 180,
              easing: "cubic-bezier(0.23, 1, 0.32, 1)",
            },
          );
        }
      }
    }
    for (const button of filters) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === category),
      );
    }
    archive.hidden = ![...archive.children].some((project) => !project.hidden);
    projectCount.textContent = `${String(count).padStart(2, "0")} PROJECT${count === 1 ? "" : "S"} ${category === "all" ? "INDEXED" : "MATCHED"}`;
  }

  for (const button of filters) {
    button.addEventListener("click", () =>
      filterProjects(button.dataset.filter),
    );
  }
  document.querySelector("#project-toolbar").hidden = false;

  const spot = document.querySelector("#spot");
  const volatility = document.querySelector("#volatility");
  const callOutput = document.querySelector("#call-value");
  const putOutput = document.querySelector("#put-value");
  const chartLine = document.querySelector("#chart-line");
  const chartArea = document.querySelector("#chart-area");
  const chartPoint = document.querySelector("#chart-point");
  const chartGuide = document.querySelector("#chart-guide");
  const strike = 100;
  const rate = 0.05;
  const expiry = 1;
  let chartMaximum = 60;

  // Abramowitz–Stegun 26.2.17: normal CDF approximation (absolute error < 7.5e-8).
  function normalCDF(value) {
    const magnitude = Math.abs(value);
    const t = 1 / (1 + 0.2316419 * magnitude);
    const density =
      Math.exp(-0.5 * magnitude * magnitude) / Math.sqrt(2 * Math.PI);
    const upperTail =
      density *
      t *
      (0.31938153 +
        t *
          (-0.356563782 +
            t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return value >= 0 ? 1 - upperTail : upperTail;
  }

  function optionPrices(price, sigma) {
    const sigmaRootTime = sigma * Math.sqrt(expiry);
    const d1 =
      (Math.log(price / strike) + (rate + (sigma * sigma) / 2) * expiry) /
      sigmaRootTime;
    const d2 = d1 - sigmaRootTime;
    const discountedStrike = strike * Math.exp(-rate * expiry);
    return {
      call: Math.max(
        0,
        price * normalCDF(d1) - discountedStrike * normalCDF(d2),
      ),
      put: Math.max(
        0,
        discountedStrike * normalCDF(-d2) - price * normalCDF(-d1),
      ),
    };
  }

  function chartY(value) {
    return 140 - (value / chartMaximum) * 125;
  }

  function updateLab(updateCurve) {
    const price = Number(spot.value);
    const sigma = Number(volatility.value) / 100;
    const prices = optionPrices(price, sigma);
    document.querySelector("#spot-value").textContent = `$${price}`;
    document.querySelector("#volatility-value").textContent =
      `${volatility.value}%`;
    spot.setAttribute("aria-valuetext", `${price} dollars`);
    volatility.setAttribute("aria-valuetext", `${volatility.value} percent`);
    callOutput.value = `$${prices.call.toFixed(2)}`;
    putOutput.value = `$${prices.put.toFixed(2)}`;

    if (updateCurve) {
      chartMaximum = Math.ceil(optionPrices(150, sigma).call / 10) * 10;
      document.querySelector("#chart-max").textContent = `$${chartMaximum}`;
      const points = [];
      for (let value = 50; value <= 150; value++) {
        points.push(
          `${value === 50 ? "M" : "L"}${(32 + (value - 50) * 4.31).toFixed(2)} ${chartY(optionPrices(value, sigma).call).toFixed(2)}`,
        );
      }
      const curve = points.join(" ");
      chartLine.setAttribute("d", curve);
      chartArea.setAttribute("d", `${curve} L463 140 L32 140 Z`);
    }
    const x = 32 + (price - 50) * 4.31;
    const y = chartY(prices.call);
    chartPoint.setAttribute("cx", x.toFixed(2));
    chartPoint.setAttribute("cy", y.toFixed(2));
    chartGuide.setAttribute("d", `M${x.toFixed(2)} 140 V${y.toFixed(2)}`);
    document.querySelector("#chart-desc").textContent =
      `Theoretical call values from $50 to $150 at ${volatility.value}% volatility. Selected underlying price: $${price}. Call: $${prices.call.toFixed(2)}. Put: $${prices.put.toFixed(2)}.`;
  }

  spot.addEventListener("input", () => updateLab(false));
  volatility.addEventListener("input", () => updateLab(true));
  updateLab(true);
  document.querySelector("#lab-controls").hidden = false;

  const email = "dakariantoine@gmail.com";
  const copyButton = document.querySelector("#copy-email");
  const copyStatus = document.querySelector("#copy-status");
  function showCopyStatus(message) {
    for (const animation of copyStatus.getAnimations()) animation.cancel();
    copyStatus.textContent = message;
    copyStatus.animate([{ opacity: 0.6 }, { opacity: 1 }], {
      duration: 180,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    });
  }
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      showCopyStatus("COPIED / Email address is on your clipboard.");
    } catch {
      showCopyStatus(
        `COPY UNAVAILABLE / Select ${email} above or use “Say hello”.`,
      );
    }
  }
  copyButton.hidden = false;
  copyButton.addEventListener("click", copyEmail);
  const printButton = document.querySelector("#print-profile");
  printButton.hidden = false;
  printButton.addEventListener("click", () => window.print());

  const dialog = document.querySelector("#command-dialog");
  const commandInput = document.querySelector("#command-input");
  const commandList = document.querySelector("#command-list");
  const emptyMessage = document.querySelector("#command-empty");
  const triggers = [...document.querySelectorAll("[data-open-command]")];
  const commands = [
    {
      label: "Explore all work",
      detail: "01 / PROJECTS",
      target: "#work",
      keywords: "repositories code systems",
      category: "all",
    },
    {
      label: "Backend systems",
      detail: "FILTER / BACKEND",
      target: "#work",
      keywords: "database api ingestion",
      category: "backend",
    },
    {
      label: "Quantitative finance",
      detail: "FILTER / QUANT",
      target: "#work",
      keywords: "markets finance trading mathematics",
      category: "quant",
    },
    {
      label: "Machine learning & data",
      detail: "FILTER / ML",
      target: "#work",
      keywords: "nlp health ai",
      category: "ml",
    },
    {
      label: "Experience",
      detail: "02 / CAREER",
      target: "#experience",
      keywords: "schwab c# .net sports center resume job",
    },
    {
      label: "About & skills",
      detail: "03 / PROFILE",
      target: "#about",
      keywords: "education university mathematics dakari",
    },
    {
      label: "Contact",
      detail: "04 / CONNECT",
      target: "#contact",
      keywords: "email linkedin hello",
    },
    {
      label: "Try the option-pricing lab",
      detail: "INTERACTIVE / LAB",
      target: "#lab",
      keywords: "black scholes quant call put volatility calculator",
    },
    ...projectItems.map((project) => ({
      label: project.querySelector("h3").textContent,
      detail: "PROJECT / OPEN",
      target: `#${project.id}`,
      keywords: project.dataset.categories,
      category: "all",
    })),
  ];

  function renderCommands() {
    const query = commandInput.value.trim().toLowerCase();
    let visibleCount = 0;
    for (let index = 0; index < commands.length; index++) {
      const command = commands[index];
      const matches = `${command.label} ${command.detail} ${command.keywords}`
        .toLowerCase()
        .includes(query);
      commandList.children[index].hidden = !matches;
      if (matches) visibleCount++;
    }
    emptyMessage.hidden = visibleCount > 0;
  }

  for (const command of commands) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "command-option";
    link.href = command.target;
    link.append(document.createTextNode(command.label));
    const detail = document.createElement("span");
    detail.textContent = command.detail;
    link.append(detail);
    link.addEventListener("click", () => {
      if (command.category) filterProjects(command.category);
      dialog.close();
    });
    item.append(link);
    commandList.append(item);
  }

  function openCommands() {
    if (dialog.open) return;
    commandInput.value = "";
    renderCommands();
    dialog.showModal();
    commandInput.focus();
  }

  for (const trigger of triggers) {
    trigger.hidden = false;
    if (!/Mac|iPhone|iPad/.test(navigator.platform))
      trigger.querySelector("kbd").textContent = "Ctrl K";
    trigger.addEventListener("click", openCommands);
  }
  document
    .querySelector("#command-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
  commandInput.addEventListener("input", renderCommands);
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
      return;
    }
    const choices = [
      ...commandList.querySelectorAll("li:not([hidden]) .command-option"),
    ];
    const index = choices.indexOf(document.activeElement);
    if (event.key === "ArrowDown" && choices.length) {
      event.preventDefault();
      choices[(index + 1) % choices.length].focus();
    } else if (event.key === "ArrowUp" && choices.length) {
      event.preventDefault();
      if (index <= 0) commandInput.focus();
      else choices[index - 1].focus();
    } else if (
      event.key === "Enter" &&
      document.activeElement === commandInput &&
      choices.length
    ) {
      event.preventDefault();
      choices[0].click();
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else openCommands();
    }
  });

  const navLinks = [...document.querySelectorAll(".nav-link")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const link of navLinks) {
            if (link.hash === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          }
        }
      },
      { rootMargin: "-15% 0px -55% 0px" },
    );
    for (const link of navLinks)
      observer.observe(document.querySelector(link.hash));
    observer.observe(document.querySelector(".hero"));
  }
})();
