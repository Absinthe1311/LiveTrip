-- 查询所有坐标无效的景点
SELECT 
    id,
    name,
    city,
    location,
    address,
    source,
    createdAt
FROM Spot
WHERE location = '0,0' 
   OR location = ''
   OR location IS NULL
   OR location LIKE '0,0,0%';
