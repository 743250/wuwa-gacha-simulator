# 声骸等级 / 成长表

> PhantomLevel: 74 行 · 字段 `['Id', 'GroupId', 'Level', 'Exp']`
> PhantomGrowth: 26 行 · 字段 `['Id', 'GrowthId', 'Level', 'Value']`

## PhantomLevel（前 5 / 后 3）
```json
[
  {
    "Id": 1,
    "GroupId": 4,
    "Level": 0,
    "Exp": 0
  },
  {
    "Id": 2,
    "GroupId": 4,
    "Level": 1,
    "Exp": 400
  },
  {
    "Id": 3,
    "GroupId": 4,
    "Level": 2,
    "Exp": 600
  },
  {
    "Id": 4,
    "GroupId": 4,
    "Level": 3,
    "Exp": 900
  },
  {
    "Id": 5,
    "GroupId": 4,
    "Level": 4,
    "Exp": 1100
  },
  {
    "Id": 72,
    "GroupId": 1,
    "Level": 8,
    "Exp": 600
  },
  {
    "Id": 73,
    "GroupId": 1,
    "Level": 9,
    "Exp": 700
  },
  {
    "Id": 74,
    "GroupId": 1,
    "Level": 10,
    "Exp": 800
  }
]
```

## PhantomGrowth（全表）
```json
[
  {
    "Id": 1,
    "GrowthId": 1,
    "Level": 0,
    "Value": 10000
  },
  {
    "Id": 2,
    "GrowthId": 1,
    "Level": 1,
    "Value": 11600
  },
  {
    "Id": 3,
    "GrowthId": 1,
    "Level": 2,
    "Value": 13200
  },
  {
    "Id": 4,
    "GrowthId": 1,
    "Level": 3,
    "Value": 14800
  },
  {
    "Id": 5,
    "GrowthId": 1,
    "Level": 4,
    "Value": 16400
  },
  {
    "Id": 6,
    "GrowthId": 1,
    "Level": 5,
    "Value": 18000
  },
  {
    "Id": 7,
    "GrowthId": 1,
    "Level": 6,
    "Value": 19600
  },
  {
    "Id": 8,
    "GrowthId": 1,
    "Level": 7,
    "Value": 21200
  },
  {
    "Id": 9,
    "GrowthId": 1,
    "Level": 8,
    "Value": 22800
  },
  {
    "Id": 10,
    "GrowthId": 1,
    "Level": 9,
    "Value": 24400
  },
  {
    "Id": 11,
    "GrowthId": 1,
    "Level": 10,
    "Value": 26000
  },
  {
    "Id": 12,
    "GrowthId": 1,
    "Level": 11,
    "Value": 27600
  },
  {
    "Id": 13,
    "GrowthId": 1,
    "Level": 12,
    "Value": 29200
  },
  {
    "Id": 14,
    "GrowthId": 1,
    "Level": 13,
    "Value": 30800
  },
  {
    "Id": 15,
    "GrowthId": 1,
    "Level": 14,
    "Value": 32400
  },
  {
    "Id": 16,
    "GrowthId": 1,
    "Level": 15,
    "Value": 34000
  },
  {
    "Id": 17,
    "GrowthId": 1,
    "Level": 16,
    "Value": 35600
  },
  {
    "Id": 18,
    "GrowthId": 1,
    "Level": 17,
    "Value": 37200
  },
  {
    "Id": 19,
    "GrowthId": 1,
    "Level": 18,
    "Value": 38800
  },
  {
    "Id": 20,
    "GrowthId": 1,
    "Level": 19,
    "Value": 40400
  },
  {
    "Id": 21,
    "GrowthId": 1,
    "Level": 20,
    "Value": 42000
  },
  {
    "Id": 22,
    "GrowthId": 1,
    "Level": 21,
    "Value": 43600
  },
  {
    "Id": 23,
    "GrowthId": 1,
    "Level": 22,
    "Value": 45200
  },
  {
    "Id": 24,
    "GrowthId": 1,
    "Level": 23,
    "Value": 46800
  },
  {
    "Id": 25,
    "GrowthId": 1,
    "Level": 24,
    "Value": 48400
  },
  {
    "Id": 26,
    "GrowthId": 1,
    "Level": 25,
    "Value": 50000
  }
]
```

## PhantomQuality / Rarity
```json
{
  "quality": [
    {
      "Quality": 2,
      "LevelLimit": 10,
      "SlotUnlockLevel": null,
      "IdentifyCost": [
        {
          "Key": 36000011,
          "Value": 10
        }
      ],
      "IdentifyCoin": 200,
      "QualitySprite": "/Game/Aki/UI/UIResources/UiRole/Atlas/RoleVision/SP_VisionlQualityB.SP_VisionlQualityB"
    },
    {
      "Quality": 3,
      "LevelLimit": 15,
      "SlotUnlockLevel": [
        5,
        10,
        15
      ],
      "IdentifyCost": [
        {
          "Key": 36000012,
          "Value": 10
        }
      ],
      "IdentifyCoin": 500,
      "QualitySprite": "/Game/Aki/UI/UIResources/UiRole/Atlas/RoleVision/SP_VisionlQualityC.SP_VisionlQualityC"
    },
    {
      "Quality": 4,
      "LevelLimit": 20,
      "SlotUnlockLevel": [
        5,
        10,
        15,
        20
      ],
      "IdentifyCost": [
        {
          "Key": 36000013,
          "Value": 10
        }
      ],
      "IdentifyCoin": 1000,
      "QualitySprite": "/Game/Aki/UI/UIResources/UiRole/Atlas/RoleVision/SP_VisionlQualityD.SP_VisionlQualityD"
    },
    {
      "Quality": 5,
      "LevelLimit": 25,
      "SlotUnlockLevel": [
        5,
        10,
        15,
        20,
        25
      ],
      "IdentifyCost": [
        {
          "Key": 36000014,
          "Value": 10
        }
      ],
      "IdentifyCoin": 2000,
      "QualitySprite": "/Game/Aki/UI/UIResources/UiRole/Atlas/RoleVision/SP_VisionlQualityE.SP_VisionlQualityE"
    }
  ],
  "rarity": [
    {
      "Rare": 0,
      "Cost": 1,
      "Desc": "Text_CalabashCatchGain_0_Text",
      "PolishCost": [
        {
          "Key": 36000015,
          "Value": 1
        }
      ]
    },
    {
      "Rare": 1,
      "Cost": 3,
      "Desc": "Text_CalabashCatchGain_1_Text",
      "PolishCost": [
        {
          "Key": 36000015,
          "Value": 1
        }
      ]
    },
    {
      "Rare": 2,
      "Cost": 4,
      "Desc": "Text_CalabashCatchGain_2_Text",
      "PolishCost": [
        {
          "Key": 36000015,
          "Value": 1
        }
      ]
    },
    {
      "Rare": 3,
      "Cost": 4,
      "Desc": "Text_CalabashCatchGain_3_Text",
      "PolishCost": [
        {
          "Key": 36000015,
          "Value": 1
        }
      ]
    }
  ]
}
```
