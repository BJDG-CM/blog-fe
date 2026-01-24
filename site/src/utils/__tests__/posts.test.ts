import { describe, expect, it } from 'vitest';
import { loadPosts } from '../posts';

describe('posts loader', () => {
  it('loads posts', () => {
    const posts = loadPosts();
    expect(posts.length).toBeGreaterThan(0);
  });
});
