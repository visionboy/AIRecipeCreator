# AI Chef (Cooking Room)

냉장고 재료 사진을 분석하여 맞춤형 레시피를 제안하는 AI 기반 요리 보조 웹 애플리케이션입니다.

## 주요 기능

### 1. 사용자 인증 및 프로필
- 사용자 가입, 로그인, 로그아웃 기능
- 프로필 이미지 업로드 및 변경 기능
- 개인화된 설정 관리

### 2. AI 냉장고 분석 및 레시피 생성 (AI Chef)
- 사용자가 업로드한 식재료 사진을 Google Gemini AI가 분석하여 식별
- 식별된 재료를 기반으로 사용자의 요청(예: "한식", "2개 추천")에 맞춘 맞춤형 레시피 생성
- 정확한 계량 정보(그램, 스푼 등)가 포함된 상세 조리법 제공
- 생성된 레시피에 어울리는 이미지를 Bing 검색을 통해 자동으로 매칭하여 제공

### 3. 나만의 요리책 (Your Cookbook)
- 마음에 드는 레시피를 즐겨찾기에 추가하여 보관
- 12개 단위의 무한 스크롤 기능을 통해 저장된 수많은 레시피를 효율적으로 탐색
- 상세 레시피 조회 및 PDF 다운로드 기능

### 4. 요리 기록 (Cooking History)
- 과거에 분석했던 모든 이미지와 결과 레시피를 자동으로 기록
- 5개 단위의 무한 스크롤 기능으로 과거 기록 조회
- 여러 장의 이미지를 업로드했던 기록도 완벽하게 지원하며, 전체 화면 미리보기 기능 제공

## 기술 스택
- **Frontend**: React (Vite), Vanilla CSS (VS Code 테마 스타일)
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy
- **Database**: MariaDB (또는 SQLite)
- **AI Model**: Google Gemini 1.5 Flash
- **Image Source**: Bing Image Search API (Thumbnail)

## 설치 및 실행 방법

### Backend (백엔드)
1. `backend` 폴더로 이동합니다.
2. 가상 환경을 생성하고 의존성 패키지를 설치합니다:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. `.env` 파일을 설정합니다 (DB 연결 정보 및 GEMINI_API_KEY 설정).
4. 서버를 실행합니다:
   ```bash
   uvicorn main:app --reload
   ```
   서버는 `http://localhost:8000`에서 실행됩니다.

### Frontend (프론트엔드)
1. `frontend` 폴더로 이동합니다.
2. 의존성 패키지를 설치합니다:
   ```bash
   npm install
   ```
3. 개발 서버를 실행합니다:
   ```bash
   npm run dev
   ```
   웹 애플리케이션은 `http://localhost:5173`에서 실행됩니다.

## 사용 방법
1. 웹 브라우저에서 `http://localhost:5173`으로 접속합니다.
2. 계정을 생성하고 로그인합니다.
3. 우측 상단 프로필 메뉴에서 닉네임과 이미지를 설정할 수 있습니다.
4. "AI Chef" 메뉴에서 재료 사진을 업로드하고 원하는 요리 스타일이나 개수를 입력하여 레시피를 받습니다.
5. 생성된 레시피는 "Your Cookbook"에 저장하거나 PDF로 내려받을 수 있으며, "Cooking History"에서 언제든지 다시 확인할 수 있습니다.
