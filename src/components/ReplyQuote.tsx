import styled from 'styled-components'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { colors } from '../style/colors'
import { toPreviewText } from '../lib/messagePreview'

const REPLY_TIME_FORMAT = 'yyyy-MM-dd a h:mm'
const MISSING_ORIGINAL_TEXT = '원본 메시지를 불러올 수 없어요.'

export interface ReplyTarget {
  senderName: string
  content: string
  createdAt: string
}

const ReplyInfo = ({ target }: { target: ReplyTarget }) => (
  <>
    <ReplyHeader>
      <ReplySender>{target.senderName}</ReplySender>
      <ReplyTime>{format(new Date(target.createdAt), REPLY_TIME_FORMAT, { locale: ko })}</ReplyTime>
    </ReplyHeader>
    <ReplyContent>{toPreviewText(target.content)}</ReplyContent>
  </>
)

//말풍선 위에 붙는 답장 대상 인용 블록 (원본을 못 찾으면 안내 문구)
export const ReplyQuote = ({ target }: { target: ReplyTarget | null }) => (
  <QuoteBox>{target ? <ReplyInfo target={target} /> : <ReplyContent>{MISSING_ORIGINAL_TEXT}</ReplyContent>}</QuoteBox>
)

//입력창 위에 붙는 "지금 답장 중인 메시지" 바
export const ReplyComposerBar = ({ target, onCancel }: { target: ReplyTarget; onCancel: () => void }) => (
  <ComposerBar>
    <ComposerQuote>
      <ReplyInfo target={target} />
    </ComposerQuote>
    <CancelButton type="button" onClick={onCancel} aria-label="답장 취소">
      ✕
    </CancelButton>
  </ComposerBar>
)

const QuoteBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 16rem;
  margin-bottom: 4px;
  padding: 4px 10px;
  border-left: 3px solid ${colors.grey_300};
  border-radius: 4px;
  background-color: ${colors.surface};
`

const ReplyHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`

const ReplySender = styled.span`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Medium';
  font-size: 12px;
`

const ReplyTime = styled.span`
  color: ${colors.grey_400};
  font-family: 'Pretendard-Light';
  font-size: 11px;
`

const ReplyContent = styled.span`
  overflow: hidden;
  color: ${colors.grey_900};
  font-family: 'Pretendard-Light';
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ComposerBar = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  background-color: ${colors.surface};
  border-top: 1px solid ${colors.grey_100};
  box-sizing: border-box;
`

const ComposerQuote = styled(QuoteBox)`
  flex: 1;
  min-width: 0;
  max-width: none;
  margin-bottom: 0;
  background-color: ${colors.grey_50};
`

const CancelButton = styled.button`
  border: none;
  padding: 4px;
  background: transparent;
  color: ${colors.grey_400};
  font-size: 14px;
  cursor: pointer;
`
