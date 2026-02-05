# 测试 Plan API 的脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试 Plan API 接口" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 测试 1: 完整的请求参数
Write-Host "`n测试 1: 完整的请求参数" -ForegroundColor Yellow

$body = @{
    origin = "上海"
    destination = "北京"
    start_date = "2026-03-15"
    end_date = "2026-03-17"
    budget = 20000
    preferences = @{
        interests = "历史文化"
    }
} | ConvertTo-Json -Depth 10

$headers = @{"Content-Type" = "application/json"}

try {
    $response = Invoke-RestMethod -Uri http://localhost:3003/api/plan -Method POST -Headers $headers -Body $body
    Write-Host "✅ 请求成功" -ForegroundColor Green
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  出发地: $($response.data.summary.origin)" -ForegroundColor White
    Write-Host "  目的地: $($response.data.summary.destination)" -ForegroundColor White
    Write-Host "  天数: $($response.data.summary.days)" -ForegroundColor White
    Write-Host "  预算: $($response.data.summary.budget)" -ForegroundColor White
    Write-Host "  开始日期: $($response.data.summary.start_date)" -ForegroundColor White
    Write-Host "  结束日期: $($response.data.summary.end_date)" -ForegroundColor White
    Write-Host "  总费用: $($response.data.total_cost)" -ForegroundColor White
    Write-Host "  总距离: $($response.data.total_distance) 公里" -ForegroundColor White
    Write-Host "  行程天数: $($response.data.itinerary.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 2: 不包含出发地
Write-Host "`n测试 2: 不包含出发地" -ForegroundColor Yellow

$body2 = @{
    destination = "北京"
    start_date = "2026-03-15"
    end_date = "2026-03-17"
    budget = 20000
    preferences = @{
        interests = "历史文化"
    }
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri http://localhost:3003/api/plan -Method POST -Headers $headers -Body $body2
    Write-Host "✅ 请求成功" -ForegroundColor Green
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  出发地: $($response2.data.summary.origin)" -ForegroundColor White
    Write-Host "  目的地: $($response2.data.summary.destination)" -ForegroundColor White
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 3: 不包含预算
Write-Host "`n测试 3: 不包含预算" -ForegroundColor Yellow

$body3 = @{
    origin = "上海"
    destination = "北京"
    start_date = "2026-03-15"
    end_date = "2026-03-17"
    preferences = @{
        interests = "历史文化"
    }
} | ConvertTo-Json -Depth 10

try {
    $response3 = Invoke-RestMethod -Uri http://localhost:3003/api/plan -Method POST -Headers $headers -Body $body3
    Write-Host "✅ 请求成功" -ForegroundColor Green
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  出发地: $($response3.data.summary.origin)" -ForegroundColor White
    Write-Host "  目的地: $($response3.data.summary.destination)" -ForegroundColor White
    Write-Host "  预算: $($response3.data.summary.budget)" -ForegroundColor White
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
