import { afterEach, describe, expect, it, vi } from "vitest";
import { destinoSeguro, senhaConfere, sessaoValida, tokenSessao } from "./auth";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllEnvs());

describe("acesso por senha", () => {
  it("confere só a senha configurada", () => {
    vi.stubEnv("APP_PASSWORD", "senha-de-teste");
    expect(senhaConfere("senha-de-teste")).toBe(true);
    expect(senhaConfere("senha-errada")).toBe(false);
    expect(senhaConfere("")).toBe(false);
  });

  it("aceita o cookie gerado e rejeita outros valores", () => {
    vi.stubEnv("APP_PASSWORD", "senha-de-teste");
    const token = tokenSessao()!;
    expect(token).not.toContain("senha-de-teste");
    expect(sessaoValida(token)).toBe(true);
    expect(sessaoValida(undefined)).toBe(false);
    expect(sessaoValida(`${token}x`)).toBe(false);
  });

  it("invalida sessões quando a senha muda", () => {
    vi.stubEnv("APP_PASSWORD", "senha-de-teste");
    const antigo = tokenSessao()!;
    vi.stubEnv("APP_PASSWORD", "nova-senha");
    expect(sessaoValida(antigo)).toBe(false);
  });

  it("bloqueia tudo quando a senha não está configurada", () => {
    vi.stubEnv("APP_PASSWORD", undefined);
    expect(tokenSessao()).toBeNull();
    expect(senhaConfere("qualquer")).toBe(false);
    expect(sessaoValida("qualquer")).toBe(false);
  });
});

describe("destinoSeguro", () => {
  it("aceita só caminhos internos", () => {
    expect(destinoSeguro("/historico?q=aço")).toBe("/historico?q=aço");
    expect(destinoSeguro("//evil.example")).toBe("/");
    expect(destinoSeguro("/\\evil.example")).toBe("/");
    expect(destinoSeguro("https://evil.example")).toBe("/");
    expect(destinoSeguro(undefined)).toBe("/");
  });
});
