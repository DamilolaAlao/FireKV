// fireKV.test.ts
import { createFireKV } from "../client";

// mockKv.ts
export class MockKv {
  private store: Map<string, any> = new Map();

  async set(key: string[], value: any): Promise<void> {
    this.store.set(JSON.stringify(key), value);
  }

  async get(key: string[]): Promise<{ value: any }> {
    const value = this.store.get(JSON.stringify(key));
    return { value };
  }

  async delete(key: string[]): Promise<void> {
    this.store.delete(JSON.stringify(key));
  }

  async *list({
    prefix,
  }: {
    prefix: string[];
  }): AsyncIterableIterator<{ key: string[]; value: any }> {
    for (const [key, value] of this.store.entries()) {
      const parsedKey = JSON.parse(key);
      if (parsedKey[0] === prefix[0]) {
        yield { key: parsedKey, value };
      }
    }
  }

  async close(): Promise<void> {
    // No-op for mock
  }
}

export const openKv = async (): Promise<MockKv> => {
  return new MockKv();
};

jest.mock("@deno/kv", () => ({
  openKv: jest.fn().mockImplementation(() => openKv()),
}));

describe("FireKV", () => {
  let fireKV: Awaited<ReturnType<typeof createFireKV>>;

  beforeEach(async () => {
    fireKV = await createFireKV("test-db");
  });

  afterEach(async () => {
    await fireKV.close();
  });

  describe("Collection", () => {
    interface TestDoc {
      name: string;
      age: number;
    }

    let collection: ReturnType<typeof fireKV.collection<TestDoc>>;

    beforeEach(() => {
      collection = fireKV.collection<TestDoc>("test-collection");
    });

    test("add should create a new document with a unique id", async () => {
      const doc: TestDoc = { name: "John", age: 30 };
      const id = await collection.add(doc);
      expect(id).toBeTruthy();
      const retrievedDoc = await collection.get(id);
      expect(retrievedDoc).toEqual(doc);
    });

    test("set should update an existing document", async () => {
      const doc: TestDoc = { name: "John", age: 30 };
      const id = await collection.add(doc);
      const updatedDoc: TestDoc = { name: "John", age: 31 };
      await collection.set(id, updatedDoc);
      const retrievedDoc = await collection.get(id);
      expect(retrievedDoc).toEqual(updatedDoc);
    });

    test("get should return null for non-existent document", async () => {
      const retrievedDoc = await collection.get("non-existent-id");
      expect(retrievedDoc).toBeUndefined();
    });

    test("delete should remove a document", async () => {
      const doc: TestDoc = { name: "John", age: 30 };
      const id = await collection.add(doc);
      await collection.delete(id);
      const retrievedDoc = await collection.get(id);
      expect(retrievedDoc).toBeUndefined();
    });

    test("query should return matching documents", async () => {
      await collection.add({ name: "John", age: 30 });
      await collection.add({ name: "Jane", age: 25 });
      await collection.add({ name: "Bob", age: 40 });

      const results = await collection.query("age", ">", 25);
      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "John", age: 30 }),
          expect.objectContaining({ name: "Bob", age: 40 }),
        ])
      );
    });

    //getall test
    test("getAll should return all documents", async () => {
      const doc1: TestDoc = { name: "John", age: 30 };
      const doc2: TestDoc = { name: "Jane", age: 25 };
      const doc3: TestDoc = { name: "Bob", age: 40 };
      await collection.add(doc1);
      await collection.add(doc2);
      await collection.add(doc3);

      const results = await collection.getAll();
      expect(results).toHaveLength(3);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining(doc1),
          expect.objectContaining(doc2),
          expect.objectContaining(doc3),
        ])
      );
    });

    test("paginate should return limited documents with offset", async () => {
      const doc1: TestDoc = { name: "John", age: 30 };
      const doc2: TestDoc = { name: "Jane", age: 25 };
      const doc3: TestDoc = { name: "Bob", age: 40 };
      await collection.add(doc1);
      await collection.add(doc2);
      await collection.add(doc3);

      const resultsPage1 = await collection.paginate(2, 0);
      expect(resultsPage1).toHaveLength(2);
      expect(resultsPage1).toEqual(
        expect.arrayContaining([
          expect.objectContaining(doc1),
          expect.objectContaining(doc2),
        ])
      );

      const resultsPage2 = await collection.paginate(2, 2);
      expect(resultsPage2).toHaveLength(1);
      expect(resultsPage2).toEqual(
        expect.arrayContaining([expect.objectContaining(doc3)])
      );
    });
  });
});
