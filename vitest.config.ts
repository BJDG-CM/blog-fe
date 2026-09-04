import { defineConfig } from 'vitest/config';

/** functions/ 와 lib/ 처럼 워크스페이스 밖에 있는 코드를 위한 설정 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
