import { useEffect } from 'react';
import styled from '@emotion/styled';

interface ShortcutDescriptor {
  key: string;
  description: string;
}

interface VoiceDescriptor {
  phrase: string;
  description: string;
}

interface ShortcutOverlayProps {
  open: boolean;
  onClose: () => void;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 220;
`;

const Panel = styled.div`
  width: min(760px, 92vw);
  max-height: 80vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  padding: 24px;
  display: grid;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.palette.text};
`;

const Section = styled.section`
  display: grid;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: ${({ theme }) => theme.palette.text};
`;

const ShortcutTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text};

  th,
  td {
    padding: 8px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.border};
    text-align: left;
    vertical-align: top;
  }

  th {
    width: 200px;
    font-weight: 600;
    white-space: nowrap;
  }
`;

const keyboardShortcuts: ShortcutDescriptor[] = [
  { key: 'F1', description: '主訴入力にフォーカス' },
  { key: 'F2', description: 'O 面 ⇄ A&P 面を切り替え' },
  { key: 'F3', description: 'UnifiedSearch（コマンドパレット）を開く' },
  { key: 'Ctrl / Cmd + Enter', description: 'カルテを保存（下書き保存）' },
  { key: 'Alt + ↑ / ↓', description: 'Plan カードの並べ替え' },
  { key: 'Esc', description: '開いているオーバーレイやモーダルを閉じる' },
];

const slashCommands: ShortcutDescriptor[] = [
  { key: '/rx', description: '処方テンプレート検索を起動' },
  { key: '/cbc', description: '血算オーダの候補を呼び出し' },
];

const voiceTriggers: VoiceDescriptor[] = [
  { phrase: '「カルテ入力開始」', description: '音声入力を開始（β）' },
  { phrase: '「カルテ入力終了」', description: '音声入力を終了してテキストに反映' },
  { phrase: '「改行して」', description: '音声入力中に改行を挿入' },
];

export const ShortcutOverlay = ({ open, onClose }: ShortcutOverlayProps) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <Backdrop role="dialog" aria-modal="true" aria-label="ショートカット一覧" onClick={onClose}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <Title>ショートカット &amp; 音声トリガ一覧</Title>
        <Section>
          <SectionTitle>キーボード操作</SectionTitle>
          <ShortcutTable>
            <tbody>
              {keyboardShortcuts.map((entry) => (
                <tr key={entry.key}>
                  <th scope="row">{entry.key}</th>
                  <td>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </ShortcutTable>
        </Section>
        <Section>
          <SectionTitle>スラッシュコマンド</SectionTitle>
          <ShortcutTable>
            <tbody>
              {slashCommands.map((entry) => (
                <tr key={entry.key}>
                  <th scope="row">{entry.key}</th>
                  <td>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </ShortcutTable>
        </Section>
        <Section>
          <SectionTitle>音声入力トリガ</SectionTitle>
          <ShortcutTable>
            <tbody>
              {voiceTriggers.map((entry) => (
                <tr key={entry.phrase}>
                  <th scope="row">{entry.phrase}</th>
                  <td>{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </ShortcutTable>
        </Section>
        <InlineHint role="note">Esc キーでもこのパネルを閉じられます。</InlineHint>
      </Panel>
    </Backdrop>
  );
};

const InlineHint = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;
