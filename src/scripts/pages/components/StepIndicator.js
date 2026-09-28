import { getStepStatus } from "../../utils/auth-guard.js";
import "../../../styles/step-indicator.css";

const StepIndicator = {
  render(activeStep = 1) {
    const { step1, step2, step3 } = getStepStatus();
    const steps = [
      { label: "Akun", done: step1 },
      { label: "Profil", done: step2 },
      { label: "Selesai", done: step3 },
    ];
    return `<ol class="step-indicator" aria-label="Progres pendaftaran">${steps.map((step, index) => {
      const number = index + 1;
      const state = step.done ? "done" : number === activeStep ? "active" : "";
      return `<li class="step ${state}" ${number === activeStep ? 'aria-current="step"' : ""}><span class="step-number">${step.done ? "✓" : number}</span><span class="step-label">${step.label}</span></li>`;
    }).join("")}</ol>`;
  },
};

export default StepIndicator;
