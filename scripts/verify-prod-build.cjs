'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const buildIdPath = path.join(root, '.next', 'BUILD_ID');
const manifestPath = path.join(root, '.next', 'routes-manifest.json');

if (!fs.existsSync(buildIdPath)) {
  console.error(
    '[next] 프로덕션 빌드가 없습니다 (.next/BUILD_ID 없음).\n' +
      '`npm start` 전에 `npm run build`를 실행하거나, 개발 시에는 `npm run dev`를 쓰세요.'
  );
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error('[next] .next/routes-manifest.json이 없습니다. `npm run build`를 실행하세요.');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  console.error('[next] routes-manifest.json을 읽을 수 없습니다:', e.message);
  process.exit(1);
}

if (!Array.isArray(manifest.dataRoutes) || !Array.isArray(manifest.dynamicRoutes)) {
  console.error(
    '[next] routes-manifest가 불완전합니다 (`next dev`가 빌드 결과를 덮어쓴 경우가 많습니다).\n' +
      '조치: `.next` 폴더를 삭제한 뒤 `npm run build` → `npm start` 순으로 실행하세요.\n' +
      '평소 개발은 `npm run dev`만 사용하는 것을 권장합니다.'
  );
  process.exit(1);
}
