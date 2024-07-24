import { openKv, Kv } from "@deno/kv";
import crypto from "crypto";

type Document = Record<string, any>;

interface Collection<T extends Document> {
  add: (data: T) => Promise<string>;
  set: (id: string, data: T) => Promise<void>;
  get: (id: string) => Promise<T | null>;
  delete: (id: string) => Promise<void>;
  query: (field: keyof T, operator: string, value: any) => Promise<T[]>;
}

interface FireKV {
  collection: <T extends Document>(name: string) => Collection<T>;
  close: () => Promise<void>;
}

export const createFireKV = async (
  dbPath: string = "db.sqlite"
): Promise<FireKV> => {
  const kv: Kv = await openKv(dbPath);

  const createCollection = <T extends Document>(
    name: string
  ): Collection<T> => {
    const add = async (data: T): Promise<string> => {
      const id = crypto.randomUUID();
      await kv.set([name, id], data);
      return id;
    };

    const set = async (id: string, data: T): Promise<void> => {
      await kv.set([name, id], data);
    };

    const get = async (id: string): Promise<T | null> => {
      const result = await kv.get([name, id]);
      return result.value as T | null;
    };

    const delete_ = async (id: string): Promise<void> => {
      await kv.delete([name, id]);
    };

    const matchesQuery = (
      doc: T,
      field: keyof T,
      operator: string,
      value: any
    ): boolean => {
      const fieldValue = doc[field];
      switch (operator) {
        case "==":
          return fieldValue === value;
        case "!=":
          return fieldValue !== value;
        case ">":
          return fieldValue > value;
        case ">=":
          return fieldValue >= value;
        case "<":
          return fieldValue < value;
        case "<=":
          return fieldValue <= value;
        default:
          return false;
      }
    };

    const query = async (
      field: keyof T,
      operator: string,
      value: any
    ): Promise<T[]> => {
      const results: T[] = [];
      const prefix = [name];

      for await (const entry of kv.list({ prefix })) {
        const doc = entry.value as T;
        if (matchesQuery(doc, field, operator, value)) {
          results.push(doc);
        }
      }

      return results;
    };

    return { add, set, get, delete: delete_, query };
  };

  return {
    collection: <T extends Document>(name: string) => createCollection<T>(name),
    close: async () => await kv.close(),
  };
};
