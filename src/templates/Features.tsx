import { useTranslations } from 'next-intl';

import { Background } from '@/components/Background';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

const BotIcon = () => (
  <svg className="stroke-primary-foreground stroke-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M6 4m0 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
    <path d="M12 2v2M10 10v2M14 10v2M9 16l3 3 3-3M12 19v-5" />
    <circle cx="10" cy="7" r=".5" fill="currentColor" />
    <circle cx="14" cy="7" r=".5" fill="currentColor" />
  </svg>
);

const ModelIcon = () => (
  <svg className="stroke-primary-foreground stroke-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M9.5 3H5a2 2 0 0 0-2 2v4m6.5-6H19a2 2 0 0 1 2 2v4M9.5 3l-2 6H3m18.5-6l-2 6h-4.5m0 0l-.5 1.5m.5-1.5h-4.5m0 0L9.5 9M3 9l3 9a2 2 0 0 0 1.83 1.2h8.35A2 2 0 0 0 18 18l3-9H3z" />
  </svg>
);

const EmbedIcon = () => (
  <svg className="stroke-primary-foreground stroke-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="stroke-primary-foreground stroke-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M4 7a8 8 0 1 0 1-2.55M4 3v4h4M8 12l2 2 4-4" />
  </svg>
);

const KnowledgeIcon = () => (
  <svg className="stroke-primary-foreground stroke-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M3 19a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6a9 9 0 0 1 9 0 9 9 0 0 1 9 0M3 6v13M12 6v13M21 6v13" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="stroke-primary-foreground stroke-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M3 12l3-4 3 4 4-8 3 8 2-3h3" />
  </svg>
);

export const Features = () => {
  const t = useTranslations('Features');

  return (
    <Background id="features">
      <Section
        subtitle={t('section_subtitle')}
        title={t('section_title')}
        description={t('section_description')}
      >
        <div className="grid grid-cols-1 gap-x-3 gap-y-8 md:grid-cols-3">
          <FeatureCard icon={<ModelIcon />} title={t('feature1_title')}>
            Choose from GPT-4o, Claude, Gemini, and more. Switch models any time without rebuilding your chatbot.
          </FeatureCard>
          <FeatureCard icon={<BotIcon />} title={t('feature2_title')}>
            Match your brand with custom colours, logos, and a personality that speaks in your voice.
          </FeatureCard>
          <FeatureCard icon={<EmbedIcon />} title={t('feature3_title')}>
            One line of code to add your chatbot to any website — no developer required.
          </FeatureCard>
          <FeatureCard icon={<HistoryIcon />} title={t('feature4_title')}>
            Every conversation is stored so you can review chats, spot trends, and improve your bot over time.
          </FeatureCard>
          <FeatureCard icon={<KnowledgeIcon />} title={t('feature5_title')}>
            Upload documents or point to URLs and your chatbot will answer questions from your own content.
          </FeatureCard>
          <FeatureCard icon={<AnalyticsIcon />} title={t('feature6_title')}>
            See how many visitors are chatting, what they're asking, and how your bot is performing.
          </FeatureCard>
        </div>
      </Section>
    </Background>
  );
};
