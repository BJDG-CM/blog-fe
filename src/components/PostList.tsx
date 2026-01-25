import styled from "styled-components";

import type { Post } from "../data/posts";
import PostCard from "./PostCard";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

type PostListProps = {
  posts: Post[];
  onSelect: (post: Post) => void;
};

const PostList = ({ posts, onSelect }: PostListProps) => {
  return (
    <Grid>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onSelect={onSelect} />
      ))}
    </Grid>
  );
};

export default PostList;
