import styled from "styled-components";

import type { Post } from "../data/posts";

const Card = styled.article`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-2px);
  }
`;

const CardImage = styled.img`
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.background};
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.muted};
`;

const Title = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.25rem;
`;

const Excerpt = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const Button = styled.button`
  align-self: flex-start;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
  }
`;

type PostCardProps = {
  post: Post;
  onSelect: (post: Post) => void;
};

const PostCard = ({ post, onSelect }: PostCardProps) => {
  return (
    <Card>
      <CardImage src={post.image} alt={post.imageAlt} />
      <Meta>
        <span>{post.category}</span>
        <span>•</span>
        <span>{post.date}</span>
        <span>•</span>
        <span>{post.readTime}</span>
      </Meta>
      <Title>{post.title}</Title>
      <Excerpt>{post.excerpt}</Excerpt>
      <Button onClick={() => onSelect(post)}>Read post</Button>
    </Card>
  );
};

export default PostCard;
