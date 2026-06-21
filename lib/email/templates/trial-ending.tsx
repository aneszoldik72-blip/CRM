import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type TrialEndingEmailProps = {
  firstName?: string;
  daysLeft: number;
  upgradeUrl: string;
};

export function TrialEndingEmail({
  firstName,
  daysLeft,
  upgradeUrl,
}: TrialEndingEmailProps) {
  const greeting = firstName ? `Salut ${firstName},` : "Salut,";
  const dayLabel = daysLeft === 1 ? "1 jour" : `${daysLeft} jours`;
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`Ton essai se termine dans ${dayLabel}.`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={brand}>VOIDCRAFT</Heading>
          <Heading style={h1}>{`Ton essai se termine dans ${dayLabel}.`}</Heading>
          <Text style={p}>{greeting}</Text>
          <Text style={p}>
            {"Tu as utilisé VOIDCRAFT pendant l'essai gratuit — pour garder ton historique et continuer à suivre ton profit, choisis un plan maintenant. Pas d'engagement, annulable en 1 clic."}
          </Text>
          <Section style={{ marginTop: 24, marginBottom: 24 }}>
            <Button style={btn} href={upgradeUrl}>
              Choisir un plan
            </Button>
          </Section>
          <Text style={p}>
            Tu peux exporter toutes tes données à tout moment depuis les
            paramètres, même après expiration.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>VOIDCRAFT · Le CRM des dropshippers COD.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#0b0b0e",
  color: "#edeae3",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  maxWidth: 520,
  margin: "0 auto",
  padding: "32px 24px",
  backgroundColor: "#101015",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.06)",
};

const brand: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.18em",
  color: "#6d4dff",
  margin: 0,
  textTransform: "uppercase",
};

const h1: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  margin: "8px 0 16px",
  color: "#fafafa",
};

const p: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.6,
  margin: "0 0 12px",
  color: "#c9c7c1",
};

const btn: React.CSSProperties = {
  backgroundColor: "#6d4dff",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 500,
  padding: "12px 20px",
  borderRadius: 10,
  textDecoration: "none",
  display: "inline-block",
};

const hr: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  margin: "24px 0 16px",
};

const footer: React.CSSProperties = {
  fontSize: 12,
  color: "#6b6862",
  margin: 0,
};
