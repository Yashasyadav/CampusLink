import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { getEvidenceDetails } from "../src/lib/evidence";
import { MatchingResult } from "../src/types/matching";

describe("getEvidenceDetails canonical evidence counting", () => {
  // Case 1 — zero evidence
  test("Case 1: zero evidence returns 0 count and empty categories", () => {
    const candidate: Partial<MatchingResult> = {
      candidate_id: "c-0",
      candidate_type: "PERSON",
      title: "Zero Evidence Member",
      supporting_evidence: [],
      person_evidence_graph: {
        skills: [],
        projects: [],
        solutions: [],
        research: [],
        facilities: [],
      },
    };

    const details = getEvidenceDetails(candidate);
    assert.equal(details.totalCount, 0);
    assert.equal(details.label, "0 evidence sources");
    assert.equal(details.shortBadgeLabel, "0 Evidence Sources");
    assert.equal(details.categories.length, 0);
  });

  // Case 2 — one evidence item
  test("Case 2: one evidence item returns count 1 with singular label", () => {
    const candidate: Partial<MatchingResult> = {
      candidate_id: "p-1",
      candidate_type: "PROJECT",
      title: "Campus IoT Sensor",
      supporting_evidence: [
        {
          source_type: "PROJECT",
          source_id: "proj-101",
          source_title: "Campus IoT Sensor",
          snippet: "LoRaWAN sensor deployment across campus buildings",
          relevance: 0.88,
        },
      ],
    };

    const details = getEvidenceDetails(candidate);
    assert.equal(details.totalCount, 1);
    assert.equal(details.label, "Grounded in 1 evidence source");
    assert.equal(details.shortBadgeLabel, "1 Evidence Source");
    assert.equal(details.categories.length, 1);
    assert.equal(details.categories[0].key, "projects");
    assert.equal(details.categories[0].count, 1);
  });

  // Case 3 — multiple evidence items
  test("Case 3: multiple unique evidence items returns exact count", () => {
    const candidate: Partial<MatchingResult> = {
      candidate_id: "r-1",
      candidate_type: "RESEARCH",
      title: "Dr. Audio Expert",
      supporting_evidence: [
        {
          source_type: "RESEARCH",
          source_id: "res-1",
          source_title: "Paper A",
          snippet: "Acoustic modeling",
          relevance: 0.9,
        },
        {
          source_type: "RESEARCH",
          source_id: "res-2",
          source_title: "Paper B",
          snippet: "TinyML quantization",
          relevance: 0.85,
        },
        {
          source_type: "PROJECT",
          source_id: "proj-1",
          source_title: "Embedded Audio Node",
          snippet: "Hardware DSP implementation",
          relevance: 0.8,
        },
      ],
    };

    const details = getEvidenceDetails(candidate);
    assert.equal(details.totalCount, 3);
    assert.equal(details.label, "Grounded in 3 evidence sources");
    assert.equal(details.shortBadgeLabel, "3 Evidence Sources");
  });

  // Case 4 — duplicate evidence
  test("Case 4: duplicate evidence IDs are counted only once", () => {
    const candidate: Partial<MatchingResult> = {
      candidate_id: "c-dup",
      candidate_type: "PERSON",
      title: "Duplicated Item Person",
      person_evidence_graph: {
        skills: ["ESP32", "esp32"], // duplicate case-insensitive
        projects: [
          { project_id: "proj-dup", title: "Project Alpha" },
          { project_id: "proj-dup", title: "Project Alpha Duplicate" },
        ],
        solutions: [
          { solution_id: "sol-dup", title: "Solution A" },
          { solution_id: "sol-dup", title: "Solution A (Repeated)" },
        ],
        research: [],
        facilities: [],
      },
    };

    const details = getEvidenceDetails(candidate);
    // 1 skill + 1 project + 1 solution = 3 total unique evidence sources
    assert.equal(details.totalCount, 3);
    assert.equal(details.label, "Grounded in 3 evidence sources");

    const skillCat = details.categories.find((c) => c.key === "skills");
    const projCat = details.categories.find((c) => c.key === "projects");
    const solCat = details.categories.find((c) => c.key === "solutions");

    assert.equal(skillCat?.count, 1);
    assert.equal(projCat?.count, 1);
    assert.equal(solCat?.count, 1);
  });

  // Case 5 — project with technologies
  test("Case 5: project containing multiple technologies counts as 1 project evidence item", () => {
    const candidate: Partial<MatchingResult> = {
      candidate_id: "p-tech",
      candidate_type: "PERSON",
      title: "IoT Engineer",
      person_evidence_graph: {
        skills: [],
        projects: [
          {
            project_id: "p-ml-compress",
            title: "Edge ML Model Compression",
            technologies: ["TensorFlow Lite", "ESP32", "C++", "FreeRTOS"],
          },
        ],
        solutions: [],
        research: [],
        facilities: [],
      },
    };

    const details = getEvidenceDetails(candidate);
    assert.equal(details.totalCount, 1);
    assert.equal(details.label, "Grounded in 1 evidence source");
    assert.equal(details.categories.length, 1);
    assert.equal(details.categories[0].key, "projects");
    assert.equal(details.categories[0].count, 1);
  });

  // Case 6 — solution with technologies
  test("Case 6: solution containing multiple technologies counts as 1 solution evidence item", () => {
    const candidate: Partial<MatchingResult> = {
      candidate_id: "s-tech",
      candidate_type: "PERSON",
      title: "Audio Troubleshooter",
      person_evidence_graph: {
        skills: [],
        projects: [],
        solutions: [
          {
            solution_id: "sol-101",
            title: "TinyML model exceeds available SRAM memory",
            summary: "Quantized weights to int8 and enabled dynamic tensor arena",
            technologies: ["TensorFlow Lite Micro", "ESP-IDF", "C++"],
          },
        ],
        research: [],
        facilities: [],
      },
    };

    const details = getEvidenceDetails(candidate);
    assert.equal(details.totalCount, 1);
    assert.equal(details.label, "Grounded in 1 evidence source");
    assert.equal(details.categories.length, 1);
    assert.equal(details.categories[0].key, "solutions");
    assert.equal(details.categories[0].count, 1);
  });

  // Case 7 — combined evidence
  test("Case 7: combined evidence (2 skills, 2 projects, 2 solutions, 3 research items) equals 9 evidence sources", () => {
    const candidate: Partial<MatchingResult> = {
      candidate_id: "diya-sharma-case",
      candidate_type: "PERSON",
      title: "Diya Sharma",
      relevance_score: 0.94,
      person_evidence_graph: {
        skills: ["TinyML", "Audio Processing"],
        projects: [
          { project_id: "p1", title: "Edge ML Audio Classifier", technologies: ["ESP32", "TensorFlow Lite"] },
          { project_id: "p2", title: "Real-time Acoustic Preprocessing", technologies: ["I2S", "DSP"] },
        ],
        solutions: [
          { solution_id: "s1", title: "Microphone ADC Gain Calibration", technologies: ["ESP32"] },
          { solution_id: "s2", title: "Spectrogram Quantization Fix", technologies: ["Python", "C++"] },
        ],
        research: [
          { research_id: "r1", title: "Acoustic Feature Extraction on Constrained Microcontrollers" },
          { research_id: "r2", title: "Quantization Effects on Keyword Spotting Latency" },
          { research_id: "r3", title: "Low-Power Audio Detection in Campus Sensor Networks" },
        ],
        facilities: [],
      },
      supporting_evidence: [
        {
          source_type: "PERSON",
          source_id: "diya-sharma-case",
          source_title: "Diya Sharma",
          snippet: "Profile match",
          relevance: 0.94,
        },
      ],
    };

    const details = getEvidenceDetails(candidate);
    // 2 skills + 2 projects + 2 solutions + 3 research = 9
    assert.equal(details.totalCount, 9);
    assert.equal(details.label, "Grounded in 9 evidence sources");
    assert.equal(details.shortBadgeLabel, "9 Evidence Sources");

    assert.equal(details.categories.length, 4);
    assert.deepEqual(
      details.categories.map((c) => ({ key: c.key, count: c.count })),
      [
        { key: "skills", count: 2 },
        { key: "projects", count: 2 },
        { key: "solutions", count: 2 },
        { key: "research", count: 3 },
      ]
    );
  });

  // Case 8 — missing optional fields
  test("Case 8: missing optional fields does not crash and returns 0 count", () => {
    assert.equal(getEvidenceDetails(undefined).totalCount, 0);
    assert.equal(getEvidenceDetails(null).totalCount, 0);
    assert.equal(getEvidenceDetails({}).totalCount, 0);
    assert.equal(getEvidenceDetails({ candidate_id: "none" }).totalCount, 0);
    assert.equal(
      getEvidenceDetails({
        candidate_id: "sparse",
        person_evidence_graph: null,
        supporting_evidence: undefined,
      }).totalCount,
      0
    );
  });

  // Case 9 — privacy filtered response
  test("Case 9: only authorized evidence records in response are counted", () => {
    // The candidate response here only contains public/authorized records
    // (private resume or confidential items were omitted by backend).
    const candidate: Partial<MatchingResult> = {
      candidate_id: "priv-user",
      candidate_type: "PERSON",
      title: "Privacy Verified Student",
      person_evidence_graph: {
        skills: ["Embedded C"],
        projects: [{ project_id: "public-proj", title: "Public Capstone" }],
        solutions: [],
        research: [],
        facilities: [],
      },
    };

    const details = getEvidenceDetails(candidate);
    assert.equal(details.totalCount, 2);
    assert.equal(details.label, "Grounded in 2 evidence sources");
    assert.equal(details.categories.length, 2);
  });
});
