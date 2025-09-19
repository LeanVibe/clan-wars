# Ninja Clan Wars - Complete Card Design System for Beta Launch
import pandas as pd
import json

# Design the complete game structure
ninja_clan_wars_system = {
    "villages": {
        "Hidden Flame Village": {
            "theme": "Aggressive, fire-based techniques",
            "terrain_affinity": "Mountain Path",
            "clans": {
                "Ember Clan": {
                    "specialty": "Taijutsu + Fire Ninjutsu",
                    "playstyle": "Fast aggressive pressure",
                    "signature_jutsu": "Flame Fist Barrage"
                },
                "Forge Clan": {
                    "specialty": "Weapon-based Taijutsu",
                    "playstyle": "Equipment synergy and combos",
                    "signature_jutsu": "Thousand Blade Dance"
                }
            }
        },
        "Hidden Mist Village": {
            "theme": "Stealth, water techniques, control",
            "terrain_affinity": "River Valley", 
            "clans": {
                "Shadow Clan": {
                    "specialty": "Genjutsu + Stealth Ninjutsu",
                    "playstyle": "Control and misdirection",
                    "signature_jutsu": "Phantom Strike"
                },
                "Tide Clan": {
                    "specialty": "Water Ninjutsu + Healing",
                    "playstyle": "Resource control and sustain",
                    "signature_jutsu": "Healing Rain"
                }
            }
        },
        "Hidden Forest Village": {
            "theme": "Nature harmony, versatility, balance",
            "terrain_affinity": "Forest Grove",
            "clans": {
                "Root Clan": {
                    "specialty": "Earth/Nature Ninjutsu",
                    "playstyle": "Defensive walls and growth",
                    "signature_jutsu": "Living Wood Fortress"
                },
                "Wind Clan": {
                    "specialty": "Wind Ninjutsu + Movement",
                    "playstyle": "Mobility and positioning",
                    "signature_jutsu": "Hurricane Step"
                }
            }
        }
    },
    
    "ranking_system": {
        "student_ranks": [
            {"rank": "Academy Student", "requirement": "Complete tutorial", "reward": "Basic starter deck"},
            {"rank": "Genin Candidate", "requirement": "10 wins", "reward": "Uncommon card pack"}
        ],
        "genin_ranks": [
            {"rank": "Genin", "requirement": "25 wins", "reward": "Clan specialization choice"},
            {"rank": "Experienced Genin", "requirement": "50 wins + 60% winrate", "reward": "Rare card selection"}
        ],
        "chunin_ranks": [
            {"rank": "Chunin", "requirement": "100 wins + tournament participation", "reward": "Epic card guaranteed"},
            {"rank": "Elite Chunin", "requirement": "200 wins + 65% winrate", "reward": "Clan master training"}
        ],
        "jonin_ranks": [
            {"rank": "Jonin", "requirement": "500 wins + regional tournament top 16", "reward": "Legendary card choice"},
            {"rank": "Elite Jonin", "requirement": "1000 wins + 70% winrate", "reward": "Village representative status"}
        ],
        "kage_ranks": [
            {"rank": "Kage Candidate", "requirement": "Global tournament top 8", "reward": "Exclusive village leader card"},
            {"rank": "Kage", "requirement": "Global tournament victory", "reward": "Season legendary card creation"}
        ]
    },
    
    "card_progression": {
        "fusion_system": {
            "common_fusion": "3 identical commons → 1 uncommon of same clan",
            "uncommon_fusion": "3 identical uncommons → 1 rare of same clan", 
            "rare_fusion": "3 identical rares → 1 epic of same village",
            "epic_fusion": "2 identical epics → 1 legendary (choice of 3)"
        },
        "upgrade_system": {
            "card_levels": "Cards can be upgraded 1-5 stars using duplicates",
            "stat_scaling": "+10% attack/health per star level",
            "ability_enhancement": "Level 3: Enhanced ability, Level 5: New secondary ability"
        }
    }
}

# Design complete card database for beta
card_database = {
    "common_cards": [
        # Hidden Flame Village - Ember Clan
        {"id": 1, "name": "Fire Academy Student", "village": "Hidden Flame", "clan": "Ember", "school": "Taijutsu", 
         "cost": 1, "attack": 1, "health": 2, "ability": "Gain +1 attack on Mountain Path", "rarity": "Common"},
        {"id": 2, "name": "Ember Apprentice", "village": "Hidden Flame", "clan": "Ember", "school": "Ninjutsu",
         "cost": 2, "attack": 2, "health": 1, "ability": "Deal 1 damage to adjacent enemies when played", "rarity": "Common"},
        {"id": 3, "name": "Flame Punch", "village": "Hidden Flame", "clan": "Ember", "school": "Taijutsu",
         "cost": 2, "type": "Jutsu", "effect": "Deal 3 damage, +1 on Mountain Path", "rarity": "Common"},
        {"id": 4, "name": "Basic Fireball", "village": "Hidden Flame", "clan": "Ember", "school": "Ninjutsu", 
         "cost": 3, "type": "Jutsu", "effect": "Deal 2 damage to target and adjacent enemies", "rarity": "Common"},
        
        # Hidden Flame Village - Forge Clan  
        {"id": 5, "name": "Weapon Apprentice", "village": "Hidden Flame", "clan": "Forge", "school": "Taijutsu",
         "cost": 1, "attack": 2, "health": 1, "ability": "Gains +1 attack for each weapon equipped", "rarity": "Common"},
        {"id": 6, "name": "Shuriken Throw", "village": "Hidden Flame", "clan": "Forge", "school": "Taijutsu",
         "cost": 1, "type": "Jutsu", "effect": "Deal 2 damage to any target", "rarity": "Common"},
        {"id": 7, "name": "Steel Kunai", "village": "Hidden Flame", "clan": "Forge", "school": "Equipment",
         "cost": 2, "type": "Equipment", "effect": "Equipped unit gains +1 attack and First Strike", "rarity": "Common"},
        {"id": 8, "name": "Forge Student", "village": "Hidden Flame", "clan": "Forge", "school": "Taijutsu",
         "cost": 2, "attack": 1, "health": 3, "ability": "Can equip 2 weapons instead of 1", "rarity": "Common"},
        
        # Hidden Mist Village - Shadow Clan
        {"id": 9, "name": "Mist Academy Student", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu",
         "cost": 1, "attack": 1, "health": 1, "ability": "Stealth: Cannot be targeted by jutsu first turn", "rarity": "Common"},
        {"id": 10, "name": "Shadow Apprentice", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu",
         "cost": 2, "attack": 1, "health": 2, "ability": "When played: Confuse target enemy (attacks randomly)", "rarity": "Common"},
        {"id": 11, "name": "Mist Veil", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu", 
         "cost": 2, "type": "Jutsu", "effect": "All friendly units gain stealth for 1 turn", "rarity": "Common"},
        {"id": 12, "name": "Shadow Clone", "village": "Hidden Mist", "clan": "Shadow", "school": "Ninjutsu",
         "cost": 3, "type": "Jutsu", "effect": "Summon 1/1 copy of target friendly unit", "rarity": "Common"},
        
        # Hidden Mist Village - Tide Clan
        {"id": 13, "name": "Water Student", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu",
         "cost": 1, "attack": 1, "health": 2, "ability": "Regenerate 1 health at start of turn on River Valley", "rarity": "Common"},
        {"id": 14, "name": "Healing Spring", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu",
         "cost": 2, "type": "Jutsu", "effect": "Restore 3 health to target", "rarity": "Common"},
        {"id": 15, "name": "Water Bullet", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu",
         "cost": 2, "attack": 0, "health": 0, "type": "Jutsu", "effect": "Deal 3 damage, push target back one space", "rarity": "Common"},
        {"id": 16, "name": "Tide Apprentice", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu", 
         "cost": 3, "attack": 2, "health": 2, "ability": "When played: Heal all damaged friendly units 1 health", "rarity": "Common"},
        
        # Hidden Forest Village - Root Clan
        {"id": 17, "name": "Forest Student", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu",
         "cost": 1, "attack": 1, "health": 3, "ability": "Defender: Must be attacked before other units in lane", "rarity": "Common"},
        {"id": 18, "name": "Root Apprentice", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu",
         "cost": 2, "attack": 1, "health": 2, "ability": "Grows: Gains +1 health at end of each turn", "rarity": "Common"},
        {"id": 19, "name": "Stone Wall", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu",
         "cost": 3, "type": "Jutsu", "effect": "Summon 0/4 Wall that blocks enemy advances", "rarity": "Common"},
        {"id": 20, "name": "Earth Spike", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu",
         "cost": 2, "type": "Jutsu", "effect": "Deal 2 damage, +2 damage on Forest Grove", "rarity": "Common"},
        
        # Hidden Forest Village - Wind Clan  
        {"id": 21, "name": "Wind Student", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu",
         "cost": 1, "attack": 2, "health": 1, "ability": "Swift: Can move after attacking", "rarity": "Common"},
        {"id": 22, "name": "Gust", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu",
         "cost": 1, "type": "Jutsu", "effect": "Move target unit to different lane", "rarity": "Common"},
        {"id": 23, "name": "Wind Apprentice", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu",
         "cost": 3, "attack": 2, "health": 2, "ability": "Flying: Can only be blocked by other flying units", "rarity": "Common"},
        {"id": 24, "name": "Air Slash", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu",
         "cost": 3, "type": "Jutsu", "effect": "Deal 4 damage to flying unit or 2 to ground unit", "rarity": "Common"}
    ]
}

print("NINJA CLAN WARS - COMPLETE BETA CARD SYSTEM")
print("=" * 50)

print(f"\n🏘️ VILLAGE STRUCTURE:")
for village_name, village_data in ninja_clan_wars_system["villages"].items():
    print(f"\n{village_name.upper()}:")
    print(f"  Theme: {village_data['theme']}")
    print(f"  Terrain Affinity: {village_data['terrain_affinity']}")
    print(f"  Clans:")
    for clan_name, clan_data in village_data["clans"].items():
        print(f"    • {clan_name}: {clan_data['specialty']}")
        print(f"      Playstyle: {clan_data['playstyle']}")
        print(f"      Signature: {clan_data['signature_jutsu']}")

print(f"\n🎖️ RANKING PROGRESSION:")
for rank_category, ranks in ninja_clan_wars_system["ranking_system"].items():
    print(f"\n{rank_category.replace('_', ' ').title()}:")
    for rank in ranks:
        print(f"  • {rank['rank']}: {rank['requirement']} → {rank['reward']}")

print(f"\n📊 BETA COMMON CARDS SAMPLE (24 of 60 total):")
common_df = pd.DataFrame(card_database["common_cards"])
print(common_df[['name', 'village', 'clan', 'school', 'cost', 'rarity']].head(12).to_string(index=False))

# Calculate complete beta card distribution
print(f"\n🎯 COMPLETE BETA CARD DISTRIBUTION:")
total_cards_needed = {
    "Common (1-3 cost)": 60,
    "Uncommon (4-6 cost)": 36, 
    "Rare (7-9 cost)": 18,
    "Epic (10-12 cost)": 6,
    "Legendary (13-15 cost)": 3
}

for rarity, count in total_cards_needed.items():
    print(f"  {rarity}: {count} cards")

print(f"\nTotal Beta Cards: {sum(total_cards_needed.values())}")

print(f"\n💎 PROGRESSION SYSTEMS:")
fusion = ninja_clan_wars_system["card_progression"]["fusion_system"]
for fusion_type, rule in fusion.items():
    print(f"  • {fusion_type.replace('_', ' ').title()}: {rule}")