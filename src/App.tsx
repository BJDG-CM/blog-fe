import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import Footer from "./components/Footer";
import Header from "./components/Header";
import PostDetail from "./components/PostDetail";
import PostList from "./components/PostList";
import { posts } from "./data/posts";
import GlobalStyle from "./styles/GlobalStyle";

const Page = styled.div`
  min-height: 100vh;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

const Hero = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HeroText = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Eyebrow = styled.span`
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  color: ${({ theme }) => theme.colors.muted};
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: clamp(2.4rem, 3vw, 3rem);
`;

const HeroDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const HeroCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg};
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const HeroStat = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.muted};
`;

const Section = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const SectionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const HeadingTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const HeadingDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accent : "transparent"};
  color: ${({ theme, $active }) => ($active ? "#fff" : theme.colors.text)};
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.card};
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.95rem;
  background: transparent;
`;

const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.muted};
`;

const About = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.card};
`;

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState(posts[0]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((post) => post.category)))],
    [],
  );

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "All" || post.category === activeCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  useEffect(() => {
    if (!filteredPosts.find((post) => post.id === selectedPost.id)) {
      setSelectedPost(filteredPosts[0] ?? posts[0]);
    }
  }, [filteredPosts, selectedPost.id]);

  return (
    <Page>
      <GlobalStyle />
      <Container>
        <Header />
        <Main>
          <Hero>
            <HeroText>
              <Eyebrow>Personal blog</Eyebrow>
              <HeroTitle>Minimal stories for creative minds.</HeroTitle>
              <HeroDescription>
                Essays on design, gentle productivity, and the slower internet.
                Curated notes, readable layouts, and a single accent tone for
                quiet focus.
              </HeroDescription>
              <SearchBar role="search">
                <span aria-hidden="true">🔍</span>
                <SearchInput
                  type="search"
                  placeholder="Search by title or keyword"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search posts"
                />
              </SearchBar>
            </HeroText>
            <HeroCard>
              <HeadingTitle>Weekly ritual</HeadingTitle>
              <HeadingDescription>
                A short reflection, a reading list, and one actionable idea every
                Sunday.
              </HeadingDescription>
              <HeroStat>
                <span>Subscribers</span>
                <strong>12.4k</strong>
              </HeroStat>
              <HeroStat>
                <span>Average open rate</span>
                <strong>58%</strong>
              </HeroStat>
            </HeroCard>
          </Hero>

          <Section id="categories">
            <SectionHeading>
              <HeadingTitle>Browse by category</HeadingTitle>
              <HeadingDescription>
                Filter essays to stay focused on the topics you care about.
              </HeadingDescription>
            </SectionHeading>
            <FilterRow>
              {categories.map((category) => (
                <FilterButton
                  key={category}
                  type="button"
                  $active={category === activeCategory}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </FilterButton>
              ))}
            </FilterRow>
          </Section>

          <Section id="posts">
            <SectionHeading>
              <HeadingTitle>Latest posts</HeadingTitle>
              <HeadingDescription>
                Tap a card to open the full reading experience.
              </HeadingDescription>
            </SectionHeading>
            {filteredPosts.length ? (
              <PostList posts={filteredPosts} onSelect={setSelectedPost} />
            ) : (
              <EmptyState>No posts match your search.</EmptyState>
            )}
          </Section>

          <Section>
            <SectionHeading>
              <HeadingTitle>Featured post</HeadingTitle>
              <HeadingDescription>
                A full, distraction-free article page preview.
              </HeadingDescription>
            </SectionHeading>
            <PostDetail post={selectedPost} />
          </Section>

          <About id="about">
            <HeadingTitle>About the author</HeadingTitle>
            <HeadingDescription>
              Hi, I’m Mira. I write about crafting digital spaces that feel calm
              and considered. When I’m not designing interfaces, I’m collecting
              photographs of soft light and slow mornings.
            </HeadingDescription>
          </About>
        </Main>
        <Footer />
      </Container>
    </Page>
  );
};

export default App;
