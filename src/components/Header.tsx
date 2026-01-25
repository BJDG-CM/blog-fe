import styled from "styled-components";

const HeaderWrapper = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const BrandTitle = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.6rem;
  font-weight: 600;
`;

const BrandSubtitle = styled.span`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.muted};
`;

const Nav = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const NavLink = styled.a`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  position: relative;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 0;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.accent};
    transition: width 0.2s ease;
  }

  &:hover:after,
  &:focus-visible:after {
    width: 100%;
  }
`;

const Header = () => {
  return (
    <HeaderWrapper>
      <Brand>
        <BrandTitle>Clarity Journal</BrandTitle>
        <BrandSubtitle>Thoughtful essays on design and slow living.</BrandSubtitle>
      </Brand>
      <Nav aria-label="Primary">
        <NavLink href="#posts">Posts</NavLink>
        <NavLink href="#categories">Categories</NavLink>
        <NavLink href="#about">About</NavLink>
        <NavLink href="#contact">Contact</NavLink>
      </Nav>
    </HeaderWrapper>
  );
};

export default Header;
