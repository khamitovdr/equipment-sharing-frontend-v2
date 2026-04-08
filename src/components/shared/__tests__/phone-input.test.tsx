import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhoneInput } from "../phone-input";

describe("PhoneInput", () => {
  it("renders with a formatted value", () => {
    render(<PhoneInput value="+7 (999) 123-45-67" onChange={() => {}} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("+7 (999) 123-45-67");
  });

  it("formats on change and calls onChange with formatted value", async () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "9");
    expect(onChange).toHaveBeenCalledWith("+7 (9");
  });

  it("passes aria-invalid to the input", () => {
    render(
      <PhoneInput value="" onChange={() => {}} aria-invalid={true} />
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
