````markdown
# FireKV

FireKV is a lightweight, type-safe document database abstraction layer for Deno's Key-Value (KV) store. It provides a Firebase-like API for easy data management with TypeScript support.

## Features

- Simple and intuitive API similar to Firebase Firestore
- Type-safe collections and queries
- Built on top of Deno's native KV store for performance and reliability
- Supports basic CRUD operations and querying
- Lightweight with no external dependencies

## Installation

To use FireKV in your Deno project, you can import it directly from the GitHub repository:

```typescript
import { createFireKV } from "firekv";
```
````

## Usage

### Creating a FireKV instance

```typescript
// Create db
const db = await createFireKV();
```

### Defining a collection

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

const usersCollection = db.collection<User>("users");
```

### Adding a document (create)

```typescript
const userId = await usersCollection.add({
  name: "John Doe",
  age: 30,
  email: "john@example.com",
});
console.log("Added user with ID:", userId);
```

### Setting a document (update)

```typescript
await usersCollection.set("custom-id", {
  name: "Jane Doe",
  age: 28,
  email: "jane@example.com",
});
```

### Getting a document (get one)

```typescript
const user = await usersCollection.get(userId);
console.log("Retrieved user:", user);
```

### Getting all documents (get all)

```typescript
const users = await usersCollection.getAll();
console.log("Retrieved users:", users);
```

### Deleting a document (delete)

```typescript
await usersCollection.delete(userId);
```

### Querying documents

```typescript
const adults = await usersCollection.query("age", ">=", 18);
console.log("Adult users:", adults);
```

### Closing the database

```typescript
await fireKV.close();
```

## API Reference

### `createFireKV(dbPath: string): Promise<FireKV>`

Creates and returns a new FireKV instance.

### `FireKV`

- `collection<T extends Document>(name: string): Collection<T>` - Creates or retrieves a typed collection.
- `close(): Promise<void>` - Closes the database connection.

### `Collection<T>`

- `add(data: T): Promise<string>` - Adds a new document and returns its ID.
- `set(id: string, data: T): Promise<void>` - Sets a document with the specified ID.
- `get(id: string): Promise<T | null>` - Retrieves a document by ID.
- `getAll(): Promise<T[]>` - Retrieves all documents.
- `delete(id: string): Promise<void>` - Deletes a document by ID.
- `query(field: keyof T, operator: string, value: any): Promise<T[]>` - Queries documents based on field, operator, and value.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
