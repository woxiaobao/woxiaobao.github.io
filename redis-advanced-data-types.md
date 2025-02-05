# Redis高版本数据类型深度解析

## 目录
- [1. Bitmap（位图）](#1-bitmap位图)
- [2. HyperLogLog（基数统计）](#2-hyperloglog基数统计)
- [3. GEO（地理位置）](#3-geo地理位置)

## 1. Bitmap（位图）

### 1.1 数据结构图
```
+---+---+---+---+---+---+---+---+
| 0 | 1 | 0 | 0 | 1 | 1 | 0 | 1 |
+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7    位置
```

### 1.2 原理讲解
Bitmap不是一个实际的数据类型，而是基于String类型的位操作。在Redis中，String类型的值最大可以是512MB，即可以存储多达2^32个不同的位。每个位只能存储0或1两种状态，非常适合存储布尔类型的数据。

### 1.3 应用场景
1. 用户签到记录
2. 在线状态统计
3. 判断用户是否是会员
4. 统计活跃用户数

### 1.4 SpringBoot集成示例
```java
@Service
public class UserSignService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    // 用户签到
    public void userSign(String userId, LocalDate date) {
        String key = "user:sign:" + userId + ":" + date.getYear() + ":" + date.getMonthValue();
        redisTemplate.opsForValue().setBit(key, date.getDayOfMonth() - 1, true);
    }
    
    // 检查用户是否签到
    public boolean checkSign(String userId, LocalDate date) {
        String key = "user:sign:" + userId + ":" + date.getYear() + ":" + date.getMonthValue();
        return Boolean.TRUE.equals(redisTemplate.opsForValue().getBit(key, date.getDayOfMonth() - 1));
    }
}
```

## 2. HyperLogLog（基数统计）

### 2.1 数据结构图
```
+----------------+
|  Register 1    |
+----------------+
|  Register 2    |
+----------------+
|      ...       |
+----------------+
|  Register 16384|
+----------------+
```

### 2.2 原理讲解
HyperLogLog是一种用于基数统计的概率性数据结构，可以在使用固定且很小的内存空间（每个HyperLogLog键只需要花费12KB内存）的情况下，计算集合中不重复元素的数量。其原理基于概率学中的伯努利试验，通过观察集合元素的二进制表示中前导零的数量来估算基数。

### 2.3 应用场景
1. 统计网站UV（独立访客）
2. 统计APP日活用户数
3. 统计用户搜索关键词数量
4. 统计在线用户数

### 2.4 SpringBoot集成示例
```java
@Service
public class UVCountService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    // 记录用户访问
    public void recordUserVisit(String userId, LocalDate date) {
        String key = "uv:" + date;
        redisTemplate.opsForHyperLogLog().add(key, userId);
    }
    
    // 获取当日UV
    public long getUVCount(LocalDate date) {
        String key = "uv:" + date;
        return redisTemplate.opsForHyperLogLog().size(key);
    }
    
    // 获取指定时间范围内的UV
    public long getUVCountInRange(LocalDate startDate, LocalDate endDate) {
        String destKey = "uv:range:" + startDate + ":" + endDate;
        String[] keys = new String[(int) ChronoUnit.DAYS.between(startDate, endDate) + 1];
        int index = 0;
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            keys[index++] = "uv:" + date;
        }
        redisTemplate.opsForHyperLogLog().union(destKey, keys);
        return redisTemplate.opsForHyperLogLog().size(destKey);
    }
}
```

## 3. GEO（地理位置）

### 3.1 数据结构图
```
+-------------+-------------+----------+
|    经度     |    纬度     |   成员    |
+-------------+-------------+----------+
| 116.397128  |  39.916527  |  商家A   |
| 116.321429  |  39.897308  |  商家B   |
| 116.380338  |  39.913527  |  商家C   |
+-------------+-------------+----------+
```

### 3.2 原理讲解
GEO（Geospatial）是Redis用于存储地理位置信息的数据类型，其底层实际上是基于Sorted Set实现的。Redis会将二维的经纬度转换成一维的52位整数（GeoHash编码），并将这个整数作为Sorted Set的score值。这种设计让我们可以方便地进行范围查找和距离计算。

### 3.3 应用场景
1. 附近的人/店铺查询
2. 打车软件的司机派单
3. 外卖配送距离计算
4. 社交软件的位置服务

### 3.4 SpringBoot集成示例
```java
@Service
public class LocationService {
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    // 添加商家位置
    public void addShopLocation(String shopId, double longitude, double latitude) {
        String key = "shop:locations";
        redisTemplate.opsForGeo().add(key, new Point(longitude, latitude), shopId);
    }
    
    // 查找附近的商家
    public List<GeoResult<RedisGeoCommands.GeoLocation<String>>> findNearbyShops(
            double longitude, double latitude, double radius) {
        String key = "shop:locations";
        Circle circle = new Circle(new Point(longitude, latitude), new Distance(radius, Metrics.KILOMETERS));
        GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo()
                .search(key, circle);
        return results.getContent();
    }
    
    // 计算两个商家之间的距离
    public Distance getDistance(String shopId1, String shopId2) {
        String key = "shop:locations";
        return redisTemplate.opsForGeo()
                .distance(key, shopId1, shopId2, Metrics.KILOMETERS);
    }
}
```

## 总结
本文详细介绍了Redis高版本中三种重要的数据类型：Bitmap、HyperLogLog和GEO。这些数据类型各有特色，能够高效地解决特定场景下的问题：

- Bitmap适合处理布尔类型的数据统计
- HyperLogLog擅长处理基数统计问题
- GEO专门用于处理地理位置相关的业务场景

在实际应用中，合理使用这些数据类型不仅能提高系统性能，还能大大降低内存使用量。通过SpringBoot的集成示例，我们可以看到这些数据类型在实际项目中的应用方式都相对简单直观。选择合适的数据类型对于提升系统性能和可维护性至关重要。