import request from "supertest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { app } from "../src/index";
import axios from "axios";

vi.mock("axios");

beforeEach(() => {
  process.env.TMDB_API_KEY = "test";
  (axios.get as any) = vi.fn(async (url: string, opts?: any) => {
    if (url.includes("/search/movie")) {
      return { data: { results: [] } };
    }
    if (url.includes("/search/multi")) {
      return { data: { results: [{ media_type: "movie", id: 10, title: "Fallback Movie", overview: "desc" }] } };
    }
    if (url.includes("/collection/")) {
      return { data: { parts: [] } };
    }
    if (url.includes("/discover/movie")) {
      return { data: { results: [{ id: 99, title: "Discover Result" }] } };
    }
    return { data: {} };
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("search movie endpoint", () => {
  it("retorna resultados quando busca direta falha e multi retorna", async () => {
    const res = await request(app).get("/api/search/movie").query({ query: "teste", page: 1 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.total_pages).toBeGreaterThanOrEqual(1);
  });

  it("paginacao local funciona", async () => {
    // Força muitos resultados vindos do discover
    (axios.get as any) = vi.fn(async (url: string, opts?: any) => {
      if (url.includes("/search/movie") || url.includes("/search/multi") || url.includes("/search/collection")) {
        return { data: { results: [] } };
      }
      if (url.includes("/discover/movie")) {
        return { data: { results: Array.from({ length: 45 }, (_, i) => ({ id: i + 1, title: `Item ${i + 1}` })) } };
      }
      return { data: {} };
    });
    const res1 = await request(app).get("/api/search/movie").query({ query: "paginacao-longa", page: 1 });
    const res2 = await request(app).get("/api/search/movie").query({ query: "paginacao-longa", page: 3 });
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.results.length).toBe(20);
    expect(res2.body.results.length).toBe(5);
    expect(res1.body.total_pages).toBe(3);
  });
});