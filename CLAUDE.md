# CLAUDE.md

## 언어 규칙

- 모든 답변과 화면 문구는 한국어로 작성한다.

@AGENTS.md

## DB 구조

- DB 구조(테이블, 컬럼, 허용 값, RLS 정책)는 `supabase/schema.sql`을 기준으로 참고한다.
- 이 파일은 실행하면 기존 테이블을 삭제(`drop table`)하고 다시 만든다. 함부로 실행하지 않는다.

## 권한

- 로그인은 Supabase Auth(이메일+비밀번호), 역할은 `profiles` 테이블(교섭담당/사업장담당)로 구분한다.
- 권한은 화면(버튼 숨김), 서버 함수(`authorize`), DB RLS 정책 세 곳에서 모두 확인한다. 새 기능을 만들 때도 세 곳을 같이 맞춘다.
- DB 권한 변경은 `supabase/migrations/`에 새 SQL 파일로 만들고, `supabase/schema.sql`에도 같은 내용을 반영한다.
