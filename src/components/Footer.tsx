import styled from "styled-components";

const FooterWrapper = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.xl} 0;
  margin-top: ${({ theme }) => theme.spacing.xxl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.9rem;
`;

const Footer = () => {
  return (
    <FooterWrapper id="contact">
      <strong>Stay in touch</strong>
      <span>
        Subscribe for monthly notes on design, writing, and gentle productivity.
      </span>
      <span>Email: hello@clarityjournal.com</span>
    </FooterWrapper>
  );
};

export default Footer;
