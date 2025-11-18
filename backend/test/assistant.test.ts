import request from "supertest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { app } from "../src/index";
import axios from "axios";

vi.mock("axios");

beforeEach(() => {
  process.env.TMDB_API_KEY = "test";
  process.env.OPENAI_API_KEY = "";
  (axios.get as any) = vi.fn(async (url: string, opts?: any) => {
    if (url.includes("/search/movie")) {
      return { data: { results: [] } };
    }
    if (url.includes("/discover/movie")) {
      return { data: { results: [{ id: 1 }] } };
    }
    if (url.includes("/movie/1")) {
      return {
        data: {
          id: 1,
          title: "Exemplo",
          overview: "Sinopse",
          poster_path: "/p.png",
          release_date: "1999-05-21",
          vote_average: 8.0,
        },
      };
    }
    return { data: {} };
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("assistant status", () => {
  it("retorna openaiEnabled=false quando sem chave", async () => {
    const res = await request(app).get("/api/assistant/status");
    expect(res.status).toBe(200);
    expect(res.body.openaiEnabled).toBe(false);
  });

  it("retorna openaiEnabled=true quando com chave", async () => {
    process.env.OPENAI_API_KEY = "x";
    const res = await request(app).get("/api/assistant/status");
    expect(res.status).toBe(200);
    expect(res.body.openaiEnabled).toBe(true);
  });
});

describe("assistant respostas", () => {
  it("retorna sources preenchidas quando TMDB responde", async () => {
    const res = await request(app)
      .post("/api/assistant")
      .send({ query: "filmes de ação dos anos 90" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.sources.length).toBeGreaterThan(0);
    const s = res.body.sources[0];
    expect(s.id).toBe(1);
    expect(s.title).toBe("Exemplo");
    expect(typeof res.body.answer).toBe("string");
  });
});