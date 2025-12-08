# 高度なUTF-8エンコーディング修正スクリプト
param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

Write-Host "Processing: $FilePath"

# ファイルをバイト配列として読み込み  
$bytes = [System.IO.File]::ReadAllBytes($FilePath)

# まずCP932 (Shift_JIS)としてデコードしてみる
try {
    $sjis = [System.Text.Encoding]::GetEncoding(932)
    $decodedText = $sjis.GetString($bytes)
    
    # UTF-8として再エンコード
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $decodedText, $utf8NoBom)
    
    Write-Host "Successfully converted from CP932 to UTF-8: $FilePath" -ForegroundColor Green
}
catch {
    Write-Host "Failed to convert: $_" -ForegroundColor Red
    exit 1
}
