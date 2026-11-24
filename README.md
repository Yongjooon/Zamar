# Zamar

찬양팀의 주차별 포지션과 Setlist를 관리하는 모바일 웹앱입니다. React/Vite 화면은 Vercel에서 배포하고, Firebase Authentication과 Firestore를 사용합니다. 계정 생성·삭제와 관리자 등록·해제는 Vercel Functions에서 처리합니다.

## Firebase 설정

1. Firebase에서 Spark 프로젝트와 웹 앱을 만들고 Firestore Standard의 기본 DB를 프로덕션 모드로 생성합니다. 주 사용자가 한국이면 데이터 위치는 서울(`asia-northeast3`)을 선택합니다.
2. Authentication의 로그인 방법에서 이메일/비밀번호를 켭니다. Authentication 설정의 사용자 작업에서 최종 사용자의 계정 생성과 삭제를 **둘 다 차단**합니다. 해당 설정을 위해 필요하면 Authentication with Identity Platform을 활성화할 수 있으며 Spark에서는 무료 사용자 한도가 적용됩니다. 배포 전 웹 SDK의 직접 가입 요청이 거부되는지 확인합니다.
3. Vercel 프로젝트의 환경 변수에 `.env.example`의 값을 설정합니다. `VITE_FIREBASE_*`는 Firebase 웹 앱 설정값입니다. 서버용 `FIREBASE_PROJECT_ID`는 같은 프로젝트 ID이며, `FIREBASE_SERVICE_ACCOUNT_JSON`에는 해당 프로젝트의 Admin 서비스 계정 JSON 전체를 넣습니다. `ZAMAR_INITIAL_PASSWORD`는 팀에서 정한 공통 초기 비밀번호입니다. 관리자 자격 증명과 초기 비밀번호는 서버 환경에만 넣습니다. 운영과 미리보기에서 다른 Firebase 프로젝트를 쓰는 경우 변수도 각각 지정합니다.
4. Firebase CLI에 계정으로 로그인한 후 Firestore 보안 규칙을 올립니다. `PROJECT_ID`에는 배포하려는 Firebase 프로젝트 ID를 넣습니다.

   ```sh
   npx firebase-tools deploy --only firestore:rules --project PROJECT_ID
   ```

5. 로컬에서 npm 의존성을 설치한 뒤 아래 명령을 실행합니다. `.env.local`에 서버 프로젝트 ID와 Admin 자격 증명, 공통 초기 비밀번호를 설정합니다. 서비스 계정 JSON은 서버 환경 변수나 `GOOGLE_APPLICATION_CREDENTIALS`로 제공할 수 있습니다.

   ```sh
   npm run seed:data
   npm run seed:data -- --apply
   ```

   데이터 이관은 기존 주차와 팀 설정을 덮어쓰지 않습니다. 소스 JSON은 초기 이관에 사용하며 브라우저의 런타임 데이터는 Firestore에서 읽습니다. 배포 전 Firebase의 규칙과 Vercel의 환경 변수가 같은 프로젝트를 가리키는지 확인하세요.

   기존 팀장 계정은 그대로 사용합니다. 새 Firebase 프로젝트를 처음 설정하는 경우에만 운영자가 Firebase Console에서 Authentication 사용자를 만들고, 같은 UID의 `users/{uid}` 문서에 `loginId`, `name`, `role: 'admin'`, `status: 'active'`를 설정합니다. 로그인 이메일은 `아이디@zamar.invalid`입니다. 이후 계정 관리는 앱의 관리자 화면에서 진행합니다.

## 사용 방법

- 계정을 만들면 항상 일반 사용자인 **팀원**으로 생성됩니다. 사용자는 아이디와 공통 초기 비밀번호로 바로 로그인할 수 있습니다. **메뉴 → 비밀번호 변경**에서 본인 비밀번호를 변경할 수 있습니다.
- **관리자 → 계정 목록**에서 **관리자 등록**을 누르면 팀장이 되고, **관리자 등록 해제**를 누르면 팀원으로 돌아갑니다. 마지막 팀장의 관리자 등록은 해제할 수 없습니다. 팀장 계정을 삭제하려면 먼저 관리자 등록을 해제합니다.
- **Positions**에서 주차 추가와 배정 편집을, **Setlist**에서 곡 등록과 순서 변경을 할 수 있습니다. 일반 사용자는 팀 데이터 조회와 자기 비밀번호 변경이 가능합니다.
- **익명 게시판**에서 로그인한 팀원이 익명 글과 댓글을 남길 수 있습니다. 글과 댓글에는 계정 ID나 이름을 저장하지 않습니다. 댓글은 원글과 함께 작성 한 달 뒤 만료됩니다.
- iPhone은 Safari의 **공유 → 홈 화면에 추가 → 웹 앱으로 열기**, Android는 Chrome의 **설치 또는 바로가기 만들기 → 설치**를 이용합니다.

## 자동 정리

포지션과 Setlist는 한국 날짜 기준으로 오늘에서 1년 전보다 오래된 주차를 정리합니다. 익명 글은 한국 시간 기준으로 작성 한 달 뒤 만료되고, 댓글도 원글과 함께 정리됩니다. 만료된 항목은 새 조회에서 제외되고, Vercel의 일일 예약 작업이 Firestore의 만료 데이터를 삭제합니다.

Vercel의 Production에 서버용 Secret `CRON_SECRET`을 설정한 뒤 배포합니다. 예약 시각은 UTC 15:00, 즉 한국 시간 자정입니다. Hobby 플랜에서는 예약 시각부터 최대 1시간 안에 호출될 수 있습니다. `NODE_OPTIONS=--experimental-require-module` 설정도 Production에 유지합니다.

## 개발과 검사

```sh
npm ci
npm run lint
npm test
npm run build
```

Firebase 권한 통합 검사는 로컬 Java 21 환경에서 실행합니다. 테스트는 `demo-zamar` 에뮬레이터의 데이터만 초기화합니다.

```sh
npx firebase-tools emulators:exec --project demo-zamar --only auth,firestore "npm run test:firebase"
```

`npm run dev`로 브라우저 UI를 개발할 수 있습니다. 계정 생성·삭제와 권한 변경 API까지 실행하려면 Vercel 프로젝트를 연결한 다음 `npx vercel dev`를 사용합니다.
