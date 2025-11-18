import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "../src/index";
import axios from "axios";

vi.mock("axios");

beforeEach(() => {
  process.env.TMDB_API_KEY = "test";
  (axios.get as any) = vi.fn(async (url: string, opts?: any) => {
    if (url.includes("/movie/1")) {
      return { data: { id: 1, title: "Exemplo" } };
    }
    return { data: {} };
  });
});

describe("tmdb proxy", () => {
  it("retorna 400 quando caminho ausente", async () => {
    const res = await request(app).get("/api/tmdb/");
    expect([400, 404]).toContain(res.status);
  });

  it("proxy para movie/1 com cache", async () => {
    const res1 = await request(app).get("/api/tmdb/movie/1?language=pt-BR");
    expect(res1.status).toBe(200);
    expect(res1.body.id).toBe(1);
    const res2 = await request(app).get("/api/tmdb/movie/1?language=pt-BR");
    expect(res2.status).toBe(200);
    expect((axios.get as any).mock.calls.length).toBe(1);
  });
});