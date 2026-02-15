// Upstash示例
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://comic-badger-56326.upstash.io',
  token: 'AdwGAAIncDI0YTE2YTM1ZGQzOTg0NzU3YTAyNmVhMDZlYTMxZjI5YnAyNTYzMjY',
})

await redis.set("foo", "bar");
let value = await redis.get("foo");

console.log(value);