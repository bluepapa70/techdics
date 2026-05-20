# IT 용어 사전 웹서비스 구축 계획서

> HTML5 + CSS3 + Vanilla JavaScript 기반 경량 정적 웹 애플리케이션 — 백엔드 없이 브라우저만으로 동작

---

**프로젝트 핵심 목표:** AI, 네트워크, 클라우드, 개발 언어 등 다양한 IT 분야의 용어를 누구나 빠르게 검색하고 카테고리별로 탐색할 수 있는 반응형 웹 서비스를 순수 HTML/CSS/JS로 구현합니다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | TechDics — IT 용어 사전 |
| **기술 스택** | HTML5, CSS3, Vanilla JavaScript (외부 라이브러리 없음) |
| **데이터 저장** | `data.json` 정적 파일 (서버리스) |
| **배포 환경** | GitHub Pages / Vercel (무료 정적 호스팅) |
| **초기 목표 용어 수** | 200개 이상 (카테고리별 30~40개) |

---

## 2. 카테고리 구성 및 대표 용어

### 🤖 AI / 머신러닝
LLM, GPT, Transformer, Fine-tuning, RAG, Embedding, Vector DB, Prompt Engineering, Hallucination, Neural Network, CNN, RNN, Reinforcement Learning, Token, Inference, Diffusion Model, Multimodal, Agent, MCP, Overfitting

### 🌐 네트워크
TCP/IP, DNS, HTTP/HTTPS, TLS/SSL, VPN, CDN, BGP, VLAN, SDN, NAT, Load Balancer, Proxy, Firewall, Zero Trust, OSI 7계층, WebSocket, gRPC, IPv6, Anycast, QUIC

### ☁️ 클라우드 서비스
IaaS, PaaS, SaaS, Serverless, Kubernetes, Docker, Container, MSA, CI/CD, DevOps, Terraform, Service Mesh, Istio, EKS, GKE, AKS, Lambda, Edge Computing, Multi-Cloud, FinOps

### 💻 개발 언어 / 프레임워크
Compiled vs Interpreted, GC, Static Typing, Runtime, SDK, API, REST, GraphQL, ORM, MVC, Reactive, Async/Await, Closure, Immutable, TypeScript, WebAssembly, Polyfill, Transpiler, Monorepo, Package Manager

### 🔒 보안 (Security)
Zero-Day, CVE, Penetration Testing, XSS, CSRF, SQL Injection, OWASP Top 10, OAuth2, JWT, MFA, SIEM, EDR, PTaaS, Supply Chain Attack, Ransomware, Phishing, WAF, RBAC, Zero Trust, Encryption

### 🗄️ 데이터베이스 / 데이터
RDBMS, NoSQL, ACID, CAP 이론, Sharding, Replication, Index, Transaction, ETL, Data Lake, Data Warehouse, OLAP, OLTP, Schema, Migration, CDC, Time-Series DB, Graph DB, Cache, Redis

### 🛠️ 소프트웨어 공학
Agile, Scrum, Sprint, TDD, BDD, DDD, Clean Architecture, SOLID, Design Pattern, Technical Debt, Code Review, Refactoring, Pair Programming, A/B Testing, SLA/SLO/SLI, Observability, Logging, Tracing, Feature Flag

---

## 3. 파일 구조

```
techdics/
├── index.html          ← 메인 페이지 (검색창, 카테고리 탭, 카드 리스트)
├── style.css           ← 전체 스타일 (CSS Variables, 다크모드, 반응형)
├── app.js              ← 검색·필터·즐겨찾기 핵심 로직
└── data/
    └── data.json       ← 용어 데이터 (term, definition, category, tags, related)
```

---

## 4. 데이터 구조 (`data.json`)

```json
[
  {
    "id": "llm-001",
    "term": "LLM",
    "termKo": "대규모 언어 모델",
    "definition": "수십억~수조 개의 파라미터로 학습된 딥러닝 기반 언어 모델로, 텍스트 생성·번역·요약 등 다양한 언어 작업을 수행한다.",
    "category": "ai",
    "tags": ["AI", "딥러닝", "NLP"],
    "related": ["transformer", "gpt", "fine-tuning"],
    "difficulty": "intermediate"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 고유 식별자 (카테고리 접두어 + 번호) |
| `term` | string | 영문 용어 |
| `termKo` | string | 한국어 명칭 (없으면 빈 문자열) |
| `definition` | string | 한국어 정의 |
| `category` | string | 카테고리 슬러그 (ai, network, cloud, dev, security, data, engineering) |
| `tags` | string[] | 연관 태그 |
| `related` | string[] | 관련 용어 id |
| `difficulty` | string | beginner / intermediate / advanced |

---

## 5. 핵심 기능 명세

### 5-1. 실시간 검색
- 입력과 동시에 영문·한국어 동시 매칭
- Debounce 300ms 적용으로 입력 부하 최소화
- 검색어 하이라이팅 (결과 내 일치 단어 강조)

### 5-2. 카테고리 탭 필터
- 상단 탭 클릭 시 해당 카테고리 용어만 표시
- 검색과 카테고리 필터 동시 적용 가능

### 5-3. 용어 상세 모달
- 카드 클릭 시 정의·태그·관련 용어 표시
- 관련 용어 클릭 시 해당 용어로 바로 이동

### 5-4. 즐겨찾기
- `LocalStorage` 기반 저장 (브라우저 닫아도 유지)
- 즐겨찾기 탭에서 저장된 용어만 모아보기

### 5-5. 다크 모드
- `prefers-color-scheme` 미디어 쿼리로 OS 설정 자동 감지
- 수동 토글 버튼 제공, 선택 값 `LocalStorage` 유지

---

## 6. 단계별 개발 로드맵

### 1단계 — 데이터 & 구조 설계 (W1)
- [ ] `data.json` 스키마 확정
- [ ] 카테고리별 용어 30개 이상 입력 (총 200개 목표)
- [ ] `index.html` 시맨틱 마크업 완성

### 2단계 — UI 구현 (W2)
- [ ] CSS Variables 기반 라이트/다크 테마 작성
- [ ] 카테고리 탭, 검색창, 카드 그리드 레이아웃
- [ ] 모달 팝업 CSS 애니메이션

### 3단계 — JS 기능 구현 (W3)
- [ ] `fetch`로 `data.json` 로드 후 메모리 인덱스 생성
- [ ] 실시간 검색 필터 (Debounce + 하이라이팅)
- [ ] 카테고리 탭 필터 로직
- [ ] 모달 열기/닫기 + 관련 용어 링크
- [ ] 즐겨찾기 `LocalStorage` 연동

### 4단계 — 마무리 & 배포 (W4)
- [ ] 모바일 반응형 최종 점검
- [ ] 용어 200개 전체 입력 완료
- [ ] GitHub Pages 배포
- [ ] README 작성

---

## 7. UI 레이아웃 구성 (와이어프레임)

```
┌─────────────────────────────────────────────┐
│  🔤 TechDics             [🌙 다크모드] [⭐]  │  ← header
├─────────────────────────────────────────────┤
│  [ 🔍 용어 검색...                        ] │  ← 검색창
├─────────────────────────────────────────────┤
│ [전체] [AI] [네트워크] [클라우드] [보안] …   │  ← 카테고리 탭
├─────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │ LLM    │ │ Docker │ │ XSS    │ │ TCP/IP │ │  ← 용어 카드 그리드
│ │ AI     │ │ Cloud  │ │ 보안   │ │ 네트워크│ │
│ └────────┘ └────────┘ └────────┘ └────────┘ │
└─────────────────────────────────────────────┘
```

---

## 8. 기술 스택 상세

| 구성 요소 | 파일 | 역할 |
|-----------|------|------|
| **Structure** | `index.html` | 시맨틱 마크업, 모달 구조, 탭 컨테이너 |
| **Styling** | `style.css` | CSS Variables 테마, Grid/Flexbox 레이아웃, 미디어 쿼리 |
| **Logic** | `app.js` | 검색·필터·모달·즐겨찾기 전체 핵심 로직 |
| **Data** | `data/data.json` | 용어 정적 데이터베이스 |

외부 라이브러리·프레임워크 없이 순수 웹 표준만 사용합니다.

---

## 9. 향후 확장 아이디어 (Backlog)

- **AI 요약 연동:** OpenAI / Gemini API 연결로 '쉬운 설명' 버튼 제공
- **퀴즈 모드:** 데일리 5문항 용어 퀴즈 미니 게임
- **용어 기여:** GitHub PR 기반 커뮤니티 용어 제안 워크플로우
- **다국어:** 영문 정의 추가 (학습용 병행 표시)
- **PWA:** Service Worker 등록으로 오프라인 검색 지원
