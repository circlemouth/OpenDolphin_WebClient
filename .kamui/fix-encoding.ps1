# UTF-8エンコーディング修正スクリプト
param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

# ファイルをバイト配列として読み込み
$bytes = [System.IO.File]::ReadAllBytes($FilePath)

# UTF-8としてデコード
$utf8 = [System.Text.Encoding]::UTF8.GetString($bytes)

# 文字化けパターンを検出して修正を試みる
# 例: "譌･" -> "日", "譛・" -> "月" など

$replacements = @{
    '譌･' = '日'
    '譛・' = '月'
    '轣ｫ' = '火'
    '豌ｴ' = '水'
    '譛ｨ' = '木'
    '驥・' = '金'
    '蝨・' = '土'
    '鬮・' = '高'
    '荳ｭ' = '中'
    '菴・' = '低'
    '螳御ｺ・' = '完了'
    '騾ｲ陦御ｸｭ' = '進行中'
    '譛ｪ髢句ｧ・' = '未開始'
    '繝輔ぅ繝ｫ繧ｿ繝ｼ' = 'フィルター'
    '蜑阪∈' = '前へ'
    '谺｡縺ｸ' = '次へ'
    '蜆ｪ蜈亥ｺｦ' = '優先度'
    '繧ｹ繝・・繧ｿ繧ｹ' = 'ステータス'
    '萓晏ｭ倬未菫・' = '依存関係'
    '萓晏ｭ倬未菫ゅｒ陦ｨ遉ｺ' = '依存関係を表示'
    '繧ｿ繧ｹ繧ｯ謨ｰ' = 'タスク数'
    '髢句ｧ区律' = '開始日'
    '譛滄俣' = '期間'
    '騾ｲ謐・' = '進捗'
    '繧ｨ繝ｼ繧ｸ繧ｧ繝ｳ繝・' = 'エージェント'
    '隧ｳ邏ｰ' = '詳細'
    '蜑肴署繧ｿ繧ｹ繧ｯ' = '前提タスク'
}

$fixed = $utf8
foreach ($key in $replacements.Keys) {
    $fixed = $fixed.Replace($key, $replacements[$key])
}

# UTF-8として保存（BOMなし）
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($FilePath, $fixed, $utf8NoBom)

Write-Output "Fixed encoding for: $FilePath"
