import styled from "styled-components";

import type { Post } from "../data/posts";

const Article = styled.article`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.xl};
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 2rem;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.muted};
`;

const Content = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
`;

type PostDetailProps = {
  post: Post;
};

const PostDetail = ({ post }: PostDetailProps) => {
  return (
    <Article id="post-detail">
      <Meta>
        <span>{post.category}</span>
        <span>•</span>
        <span>{post.date}</span>
        <span>•</span>
        <span>{post.readTime}</span>
      </Meta>
      <Title>{post.title}</Title>
      <Content>
        {post.content.map((paragraph, index) => (
          <p key={`${post.id}-${index}`}>
            {index === 0 ? <Highlight>{paragraph}</Highlight> : paragraph}
          </p>
        ))}
      </Content>
    </Article>
  );
};

export default PostDetail;
