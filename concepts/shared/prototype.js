(() => {
  "use strict";

  const strike = 100;
  const rate = 0.05;
  const expiry = 1;

  function normalCDF(value) {
    const magnitude = Math.abs(value);
    const t = 1 / (1 + 0.2316419 * magnitude);
    const density = Math.exp(-0.5 * magnitude * magnitude) / Math.sqrt(2 * Math.PI);
    const upperTail = density * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return value >= 0 ? 1 - upperTail : upperTail;
  }

  function optionPrices(price, sigma) {
    const sigmaRootTime = sigma * Math.sqrt(expiry);
    const d1 = (Math.log(price / strike) + (rate + sigma * sigma / 2) * expiry) / sigmaRootTime;
    const d2 = d1 - sigmaRootTime;
    const discountedStrike = strike * Math.exp(-rate * expiry);
    return {
      call: Math.max(0, price * normalCDF(d1) - discountedStrike * normalCDF(d2)),
      put: Math.max(0, discountedStrike * normalCDF(-d2) - price * normalCDF(-d1)),
    };
  }

  const spot = document.querySelector("[data-spot]");
  const volatility = document.querySelector("[data-volatility]");
  if (!spot || !volatility) return;

  const spotValue = document.querySelector("[data-spot-value]");
  const volatilityValue = document.querySelector("[data-volatility-value]");
  const callValue = document.querySelector("[data-call-value]");
  const putValue = document.querySelector("[data-put-value]");
  const point = document.querySelector("[data-chart-point]");
  const guide = document.querySelector("[data-chart-guide]");

  function update() {
    const price = Number(spot.value);
    const sigma = Number(volatility.value) / 100;
    const prices = optionPrices(price, sigma);
    spotValue.textContent = `$${price}`;
    volatilityValue.textContent = `${volatility.value}%`;
    callValue.textContent = `$${prices.call.toFixed(2)}`;
    putValue.textContent = `$${prices.put.toFixed(2)}`;
    spot.setAttribute("aria-valuetext", `${price} dollars`);
    volatility.setAttribute("aria-valuetext", `${volatility.value} percent`);
    const x = 24 + ((price - 50) / 100) * 352;
    const y = 128 - Math.min(prices.call / 60, 1) * 108;
    if (point) {
      point.setAttribute("cx", x.toFixed(2));
      point.setAttribute("cy", y.toFixed(2));
    }
    if (guide) guide.setAttribute("d", `M${x.toFixed(2)} 128V${y.toFixed(2)}`);
  }

  spot.addEventListener("input", update);
  volatility.addEventListener("input", update);
  update();
})();
