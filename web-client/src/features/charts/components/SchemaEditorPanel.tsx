import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';

import { Button, SelectField, Stack, SurfaceCard, TextField } from '@/components';
import { recordOperationEvent } from '@/libs/audit';
import type { AuthSession } from '@/libs/auth/auth-types';

import { saveSchemaDocument } from '@/features/charts/api/schema-api';
import type { MedicalCertificatesPanelPatient } from '@/features/charts/components/MedicalCertificatesPanel';
import { buildSchemaDocumentPayload } from '@/features/charts/utils/schema-payload';

const CanvasContainer = styled.div`
  position: relative;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const ColorInput = styled.input`
  width: 44px;
  height: 32px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: 4px;
  background: transparent;
`;

const InlineMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.9rem;
`;

const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

type ToolType = 'pen' | 'line' | 'rectangle' | 'ellipse' | 'eraser';

interface Point {
  x: number;
  y: number;
}

type DrawingCommand =
  | { type: 'pen'; color: string; size: number; points: Point[] }
  | { type: 'line'; color: string; size: number; from: Point; to: Point }
  | { type: 'rectangle'; color: string; size: number; from: Point; to: Point; fill: boolean }
  | { type: 'ellipse'; color: string; size: number; from: Point; to: Point; fill: boolean }
  | { type: 'text'; color: string; size: number; position: Point; text: string };

interface SchemaEditorPanelProps {
  patient: MedicalCertificatesPanelPatient | null;
  patientPk: number | null;
  karteId: number | null;
  session: AuthSession | null;
  facilityName?: string;
  licenseName?: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  disabled?: boolean;
  onSaved?: () => void;
}

const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 520;

const MEDICAL_ROLES = [
  { value: 'Reference figure', label: 'Reference figure (参照図)' },
  { value: 'Operation schema', label: 'Operation schema (手術図)' },
  { value: 'Clinical note', label: 'Clinical note (臨床メモ)' },
];

export const SchemaEditorPanel = ({
  patient,
  patientPk,
  karteId,
  session,
  facilityName,
  licenseName,
  departmentName,
  departmentCode,
  disabled,
  onSaved,
}: SchemaEditorPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const commandsRef = useRef<DrawingCommand[]>([]);
  const redoStackRef = useRef<DrawingCommand[]>([]);
  const currentCommandRef = useRef<DrawingCommand | null>(null);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#2563eb');
  const [lineWidth, setLineWidth] = useState(4);
  const [fillShape, setFillShape] = useState(false);
  const [title, setTitle] = useState('Reference figure');
  const [medicalRole, setMedicalRole] = useState(MEDICAL_ROLES[0].value);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    'マウスまたはスタイラスで描画できます。保存するとカルテへシェーマ文書を追加します。',
  );
  const [isSaving, setIsSaving] = useState(false);

  const userModelId = session?.userProfile?.userModelId ?? null;
  const userId = session?.credentials.userId ?? null;
  const facilityId = session?.credentials.facilityId ?? '';
  const userCommonName = session?.userProfile?.displayName ?? session?.userProfile?.commonName ?? null;

  const isReady = useMemo(
    () => Boolean(patient && patientPk && karteId && userModelId && userId),
    [karteId, patient, patientPk, userId, userModelId],
  );

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }
    return context;
  };

  const drawCommand = useCallback((context: CanvasRenderingContext2D, command: DrawingCommand) => {
    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = command.type === 'pen' || command.type === 'line' || command.type === 'text' ? command.color : command.color;
    if ('size' in command) {
      context.lineWidth = command.size;
    }

    switch (command.type) {
      case 'pen': {
        const [start, ...rest] = command.points;
        if (!start) {
          break;
        }
        context.beginPath();
        context.moveTo(start.x, start.y);
        rest.forEach((point) => {
          context.lineTo(point.x, point.y);
        });
        context.strokeStyle = command.color;
        context.stroke();
        break;
      }
      case 'line': {
        context.beginPath();
        context.moveTo(command.from.x, command.from.y);
        context.lineTo(command.to.x, command.to.y);
        context.strokeStyle = command.color;
        context.stroke();
        break;
      }
      case 'rectangle': {
        const x = Math.min(command.from.x, command.to.x);
        const y = Math.min(command.from.y, command.to.y);
        const width = Math.abs(command.to.x - command.from.x);
        const height = Math.abs(command.to.y - command.from.y);
        context.strokeStyle = command.color;
        if (command.fill) {
          context.fillStyle = command.color;
          context.fillRect(x, y, width, height);
        }
        context.strokeRect(x, y, width, height);
        break;
      }
      case 'ellipse': {
        const centerX = (command.from.x + command.to.x) / 2;
        const centerY = (command.from.y + command.to.y) / 2;
        const radiusX = Math.abs(command.to.x - command.from.x) / 2;
        const radiusY = Math.abs(command.to.y - command.from.y) / 2;
        context.beginPath();
        context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        if (command.fill) {
          context.fillStyle = command.color;
          context.fill();
        }
        context.strokeStyle = command.color;
        context.stroke();
        break;
      }
      case 'text': {
        context.fillStyle = command.color;
        context.font = `${command.size * 6}px "Noto Sans JP", system-ui`;
        context.fillText(command.text, command.position.x, command.position.y);
        break;
      }
      default:
        break;
    }
    context.restore();
  }, []);

  const redraw = useCallback(() => {
    const context = getContext();
    if (!context) {
      return;
    }
    const canvas = canvasRef.current!;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    commandsRef.current.forEach((command) => drawCommand(context, command));
    if (currentCommandRef.current) {
      drawCommand(context, currentCommandRef.current);
    }
    context.restore();
  }, [drawCommand]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * ratio;
    canvas.height = CANVAS_HEIGHT * ratio;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(ratio, ratio);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, []);

  const toCanvasPoint = useCallback((event: PointerEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    return { x, y };
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (!isReady || disabled) {
        return;
      }
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const point = toCanvasPoint(event);
      if (!point) {
        return;
      }
      redoStackRef.current = [];
      if (tool === 'pen' || tool === 'eraser') {
        currentCommandRef.current = {
          type: 'pen',
          color: tool === 'eraser' ? '#ffffff' : color,
          size: lineWidth,
          points: [point],
        };
      } else if (tool === 'line') {
        currentCommandRef.current = { type: 'line', color, size: lineWidth, from: point, to: point };
      } else if (tool === 'rectangle' || tool === 'ellipse') {
        currentCommandRef.current = { type: tool, color, size: lineWidth, from: point, to: point, fill: fillShape };
      }
      redraw();
    },
    [color, disabled, fillShape, isReady, lineWidth, redraw, toCanvasPoint, tool],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!currentCommandRef.current) {
        return;
      }
      const point = toCanvasPoint(event);
      if (!point) {
        return;
      }
      const command = currentCommandRef.current;
      if (command.type === 'pen') {
        command.points.push(point);
      } else if (command.type === 'line' || command.type === 'rectangle' || command.type === 'ellipse') {
        command.to = point;
      }
      redraw();
    },
    [redraw, toCanvasPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (!currentCommandRef.current) {
      return;
    }
    commandsRef.current.push(currentCommandRef.current);
    currentCommandRef.current = null;
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const handlePointerCancel = () => {
      if (currentCommandRef.current) {
        currentCommandRef.current = null;
        redraw();
      }
    };
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, redraw]);

  const handleUndo = useCallback(() => {
    if (commandsRef.current.length === 0) {
      return;
    }
    const command = commandsRef.current.pop();
    if (command) {
      redoStackRef.current.push(command);
      redraw();
    }
  }, [redraw]);

  const handleRedo = useCallback(() => {
    const command = redoStackRef.current.pop();
    if (!command) {
      return;
    }
    commandsRef.current.push(command);
    redraw();
  }, [redraw]);

  const handleClear = useCallback(() => {
    commandsRef.current = [];
    redoStackRef.current = [];
    redraw();
  }, [redraw]);

  const handleTextInsert = useCallback(() => {
    if (!isReady || disabled) {
      return;
    }
    const text = window.prompt('配置するテキストを入力してください');
    if (!text) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = rect.width / 2;
    const y = rect.height / 2;
    const point: Point = {
      x: (x / rect.width) * CANVAS_WIDTH,
      y: (y / rect.height) * CANVAS_HEIGHT,
    };
    commandsRef.current.push({ type: 'text', color, size: lineWidth, position: point, text });
    redraw();
  }, [color, disabled, isReady, lineWidth, redraw]);

  const handleSave = useCallback(async () => {
    if (!patient || !patientPk || !karteId || !userModelId || !userId) {
      setError('カルテまたは患者情報が不足しています。');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('キャンバスが初期化されていません。');
      return;
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];
    setIsSaving(true);
    setError(null);
    setInfo(null);
    try {
      const payload = buildSchemaDocumentPayload({
        karteId,
        patientId: patient.id,
        patientPk,
        patientName: patient.name,
        patientGender: patient.gender,
        facilityName,
        licenseName: licenseName ?? undefined,
        departmentName: departmentName ?? undefined,
        departmentCode: departmentCode ?? undefined,
        userModelId,
        userId: `${facilityId}:${userId}`,
        userCommonName,
        jpegBase64: base64,
        title,
        medicalRole,
      });
      const documentId = await saveSchemaDocument(payload);
      recordOperationEvent('chart', 'info', 'schema_save', 'シェーマを保存しました', {
        documentId,
        patientId: patient.id,
      });
      setInfo('シェーマをカルテへ保存しました。カルテ一覧を再読み込みしてください。');
      onSaved?.();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'シェーマの保存に失敗しました。';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    departmentCode,
    departmentName,
    facilityId,
    facilityName,
    karteId,
    licenseName,
    medicalRole,
    onSaved,
    patient,
    patientPk,
    title,
    userCommonName,
    userId,
    userModelId,
  ]);

  const isFormDisabled = disabled || !isReady || isSaving;

  return (
    <SurfaceCard tone="muted">
      <Stack gap={16}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>シェーマエディタ</h2>
          <InlineMessage>線画・図形・テキストを組み合わせて手描き画像を作成し、カルテへ保存できます。</InlineMessage>
        </div>

        <Toolbar>
          <SelectField
            label="ツール"
            options={[
              { value: 'pen', label: 'ペン' },
              { value: 'line', label: '直線' },
              { value: 'rectangle', label: '四角形' },
              { value: 'ellipse', label: '楕円' },
              { value: 'eraser', label: '消しゴム' },
            ]}
            value={tool}
            onChange={(event) => setTool(event.currentTarget.value as ToolType)}
            disabled={isFormDisabled}
          />
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', marginBottom: 4 }}>線の太さ</label>
            <select
              value={lineWidth}
              onChange={(event) => setLineWidth(Number.parseInt(event.currentTarget.value, 10))}
              disabled={isFormDisabled}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db' }}
            >
              {[2, 4, 6, 8, 12].map((value) => (
                <option key={value} value={value}>
                  {value}px
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', marginBottom: 4 }}>カラー</label>
            <ColorInput type="color" value={color} onChange={(event) => setColor(event.currentTarget.value)} disabled={isFormDisabled} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: '#4b5563' }}>
            <input
              type="checkbox"
              checked={fillShape}
              onChange={(event) => setFillShape(event.currentTarget.checked)}
              disabled={isFormDisabled}
            />
            塗りつぶし
          </label>
          <Button type="button" variant="secondary" onClick={handleTextInsert} disabled={isFormDisabled}>
            テキスト挿入
          </Button>
          <Button type="button" variant="ghost" onClick={handleUndo} disabled={isFormDisabled}>
            元に戻す
          </Button>
          <Button type="button" variant="ghost" onClick={handleRedo} disabled={isFormDisabled}>
            やり直す
          </Button>
          <Button type="button" variant="ghost" onClick={handleClear} disabled={isFormDisabled}>
            全消去
          </Button>
        </Toolbar>

        <CanvasContainer>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ touchAction: 'none', display: 'block' }} />
        </CanvasContainer>

        <Stack gap={12}>
          <TextField
            label="タイトル"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            disabled={isFormDisabled}
          />
          <SelectField
            label="Medical Role"
            options={MEDICAL_ROLES}
            value={medicalRole}
            onChange={(event) => setMedicalRole(event.currentTarget.value)}
            disabled={isFormDisabled}
          />
          <Button type="button" variant="primary" onClick={handleSave} disabled={isFormDisabled}>
            保存
          </Button>
        </Stack>

        {!isReady ? <InlineMessage>カルテと患者を選択するとシェーマ保存が可能になります。</InlineMessage> : null}
        {error ? <InlineError>{error}</InlineError> : null}
        {info ? <InlineMessage>{info}</InlineMessage> : null}
      </Stack>
    </SurfaceCard>
  );
};
