# Complete the remaining rarity cards for the beta system
complete_card_database = {
    "uncommon_cards": [
        # Hidden Flame Village - Ember Clan
        {"id": 25, "name": "Fire Genin", "village": "Hidden Flame", "clan": "Ember", "school": "Taijutsu", 
         "cost": 4, "attack": 3, "health": 3, "ability": "Blaze: Deal 1 damage to attacker when damaged", "rarity": "Uncommon"},
        {"id": 26, "name": "Flame Tornado", "village": "Hidden Flame", "clan": "Ember", "school": "Ninjutsu",
         "cost": 5, "type": "Jutsu", "effect": "Deal 3 damage to all enemies in target lane", "rarity": "Uncommon"},
        {"id": 27, "name": "Ember Chunin", "village": "Hidden Flame", "clan": "Ember", "school": "Ninjutsu",
         "cost": 6, "attack": 4, "health": 4, "ability": "When played: Deal 2 damage to random enemy", "rarity": "Uncommon"},
        
        # Hidden Flame Village - Forge Clan
        {"id": 28, "name": "Weapon Master", "village": "Hidden Flame", "clan": "Forge", "school": "Taijutsu",
         "cost": 4, "attack": 2, "health": 4, "ability": "Equipped weapons grant +2 attack instead of +1", "rarity": "Uncommon"},
        {"id": 29, "name": "Chakra Blade", "village": "Hidden Flame", "clan": "Forge", "school": "Equipment",
         "cost": 4, "type": "Equipment", "effect": "Equipped unit gains +2 attack and abilities cost -1 chakra", "rarity": "Uncommon"},
        {"id": 30, "name": "Blade Dance", "village": "Hidden Flame", "clan": "Forge", "school": "Taijutsu",
         "cost": 5, "type": "Jutsu", "effect": "Deal damage equal to equipped unit's attack to all enemies", "rarity": "Uncommon"},
        
        # Hidden Mist Village - Shadow Clan  
        {"id": 31, "name": "Shadow Genin", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu",
         "cost": 4, "attack": 2, "health": 2, "ability": "Phantom: When destroyed, summon 1/1 Shadow Clone", "rarity": "Uncommon"},
        {"id": 32, "name": "Mind Control", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu",
         "cost": 5, "type": "Jutsu", "effect": "Take control of enemy unit for 2 turns", "rarity": "Uncommon"},
        {"id": 33, "name": "Mist Chunin", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu", 
         "cost": 6, "attack": 3, "health": 3, "ability": "Confusion: Adjacent enemies attack random targets", "rarity": "Uncommon"},
        
        # Hidden Mist Village - Tide Clan
        {"id": 34, "name": "Water Genin", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu",
         "cost": 4, "attack": 2, "health": 5, "ability": "Flow: Can move through enemy units", "rarity": "Uncommon"},
        {"id": 35, "name": "Tsunami", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu",
         "cost": 6, "type": "Jutsu", "effect": "Deal 2 damage to all enemies, move them back one space", "rarity": "Uncommon"},
        {"id": 36, "name": "Healing Master", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu",
         "cost": 5, "attack": 1, "health": 3, "ability": "At end of turn: Heal all friendly units 2 health", "rarity": "Uncommon"},
        
        # Hidden Forest Village - Root Clan
        {"id": 37, "name": "Earth Genin", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu", 
         "cost": 4, "attack": 1, "health": 6, "ability": "Fortress: Gains +1 health for each turn in play", "rarity": "Uncommon"},
        {"id": 38, "name": "Living Armor", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu",
         "cost": 5, "type": "Jutsu", "effect": "Target unit gains +0/+4 and Regenerate 1 health per turn", "rarity": "Uncommon"},
        {"id": 39, "name": "Forest Guardian", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu",
         "cost": 6, "attack": 4, "health": 5, "ability": "When played: Summon two 1/1 Tree Sprouts", "rarity": "Uncommon"},
        
        # Hidden Forest Village - Wind Clan
        {"id": 40, "name": "Wind Genin", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu",
         "cost": 4, "attack": 4, "health": 2, "ability": "Hurricane: Returns to hand when destroyed", "rarity": "Uncommon"},
        {"id": 41, "name": "Cyclone Strike", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu", 
         "cost": 5, "type": "Jutsu", "effect": "Deal 3 damage, move all units in lane randomly", "rarity": "Uncommon"},
        {"id": 42, "name": "Sky Dancer", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu",
         "cost": 6, "attack": 3, "health": 4, "ability": "Flying, Swift: Can attack twice per turn", "rarity": "Uncommon"}
    ],
    
    "rare_cards": [
        # Village Specialists and Advanced Jutsu
        {"id": 43, "name": "Ember Jonin", "village": "Hidden Flame", "clan": "Ember", "school": "Taijutsu",
         "cost": 7, "attack": 5, "health": 5, "ability": "Inferno: Deal 3 damage to all adjacent enemies when played", "rarity": "Rare"},
        {"id": 44, "name": "Phoenix Fire Jutsu", "village": "Hidden Flame", "clan": "Ember", "school": "Ninjutsu",
         "cost": 8, "type": "Jutsu", "effect": "Deal 6 damage, creates flame tiles that damage enemies", "rarity": "Rare"},
        {"id": 45, "name": "Master Weaponsmith", "village": "Hidden Flame", "clan": "Forge", "school": "Taijutsu",
         "cost": 7, "attack": 4, "health": 6, "ability": "All weapons cost -2 and grant additional abilities", "rarity": "Rare"},
        {"id": 46, "name": "Shadow Jonin", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu",
         "cost": 8, "attack": 3, "health": 4, "ability": "Void Step: Can appear in any lane at start of turn", "rarity": "Rare"},
        {"id": 47, "name": "Phantom Army", "village": "Hidden Mist", "clan": "Shadow", "school": "Genjutsu",
         "cost": 9, "type": "Jutsu", "effect": "Summon 1/1 clone of every friendly unit", "rarity": "Rare"},
        {"id": 48, "name": "Tide Master", "village": "Hidden Mist", "clan": "Tide", "school": "Ninjutsu",
         "cost": 7, "attack": 3, "health": 8, "ability": "All water jutsu heal friendly units for damage dealt", "rarity": "Rare"},
        {"id": 49, "name": "Root Sage", "village": "Hidden Forest", "clan": "Root", "school": "Ninjutsu",
         "cost": 8, "attack": 2, "health": 7, "ability": "Forest Bond: All friendly units gain +1/+1 per turn", "rarity": "Rare"},
        {"id": 50, "name": "Wind Master", "village": "Hidden Forest", "clan": "Wind", "school": "Ninjutsu", 
         "cost": 9, "attack": 6, "health": 3, "ability": "Storm Call: All units move randomly each turn", "rarity": "Rare"},
        {"id": 51, "name": "Legendary Blade Set", "village": "Any", "clan": "Any", "school": "Equipment",
         "cost": 7, "type": "Equipment", "effect": "Equip 3 weapons at once, unit gains abilities of all", "rarity": "Rare"},
        {"id": 52, "name": "Forbidden Technique", "village": "Any", "clan": "Any", "school": "Ninjutsu",
         "cost": 8, "type": "Jutsu", "effect": "Choose any jutsu from your village, cast it for free", "rarity": "Rare"},
        {"id": 53, "name": "Secret Assassination", "village": "Any", "clan": "Any", "school": "Genjutsu",
         "cost": 9, "type": "Jutsu", "effect": "Destroy target unit, gain stealth for 2 turns", "rarity": "Rare"},
        {"id": 54, "name": "Elemental Mastery", "village": "Any", "clan": "Any", "school": "Ninjutsu", 
         "cost": 7, "type": "Jutsu", "effect": "All terrain bonuses apply to your units this turn", "rarity": "Rare"}
    ],
    
    "epic_cards": [
        # Village Champions and Ultimate Techniques
        {"id": 55, "name": "Flame Village Champion", "village": "Hidden Flame", "clan": "Any", "school": "Taijutsu",
         "cost": 10, "attack": 7, "health": 7, "ability": "Fire Avatar: Immune to damage while on Mountain Path", "rarity": "Epic"},
        {"id": 56, "name": "Mist Village Champion", "village": "Hidden Mist", "clan": "Any", "school": "Genjutsu", 
         "cost": 11, "attack": 5, "health": 8, "ability": "Master Illusion: All enemies attack each other", "rarity": "Epic"},
        {"id": 57, "name": "Forest Village Champion", "village": "Hidden Forest", "clan": "Any", "school": "Ninjutsu",
         "cost": 10, "attack": 6, "health": 9, "ability": "Nature's Guardian: Summon forest creatures each turn", "rarity": "Epic"},
        {"id": 58, "name": "Nine-Tails Chakra Mode", "village": "Any", "clan": "Any", "school": "Ninjutsu",
         "cost": 12, "type": "Jutsu", "effect": "All friendly units gain +3/+3 and special abilities", "rarity": "Epic"},
        {"id": 59, "name": "Infinite Tsukuyomi", "village": "Any", "clan": "Any", "school": "Genjutsu",
         "cost": 11, "type": "Jutsu", "effect": "All enemies skip their next 3 turns", "rarity": "Epic"},
        {"id": 60, "name": "Sage Mode Master", "village": "Any", "clan": "Any", "school": "Ninjutsu",
         "cost": 10, "attack": 8, "health": 6, "ability": "Perfect Balance: All jutsu cost -3 chakra", "rarity": "Epic"}
    ],
    
    "legendary_cards": [
        # Kage-level Leaders
        {"id": 61, "name": "The Fire Kage", "village": "Hidden Flame", "clan": "Any", "school": "All", 
         "cost": 15, "attack": 10, "health": 10, "ability": "Absolute Flame: Win the game if you control Mountain Path for 3 turns", "rarity": "Legendary"},
        {"id": 62, "name": "The Mist Kage", "village": "Hidden Mist", "clan": "Any", "school": "All",
         "cost": 13, "attack": 8, "health": 12, "ability": "Eternal Mist: All friendly units are permanently stealthed", "rarity": "Legendary"},
        {"id": 63, "name": "The Forest Kage", "village": "Hidden Forest", "clan": "Any", "school": "All",
         "cost": 14, "attack": 9, "health": 11, "ability": "World Tree: Transform all terrain into Forest Grove", "rarity": "Legendary"}
    ]
}

# Create comprehensive progression and monetization system
progression_system = {
    "starter_decks": {
        "Hidden Flame Aggro": {
            "focus": "Fast Taijutsu pressure with Ember Clan",
            "key_cards": ["Fire Academy Student", "Flame Punch", "Ember Apprentice"],
            "win_condition": "Rush damage before opponent stabilizes",
            "upgrade_path": "Add Forge weapons for versatility"
        },
        "Hidden Mist Control": {
            "focus": "Genjutsu control with Shadow Clan", 
            "key_cards": ["Mist Veil", "Shadow Clone", "Confuse effects"],
            "win_condition": "Control board until late game power plays",
            "upgrade_path": "Add Tide healing for sustainability"
        },
        "Hidden Forest Balance": {
            "focus": "Defensive Ninjutsu with Root Clan",
            "key_cards": ["Stone Wall", "Forest Student", "Growth effects"],
            "win_condition": "Outlast opponent with defensive advantages",
            "upgrade_path": "Add Wind mobility for positioning"
        }
    },
    
    "collection_goals": {
        "beginner": "Complete one clan collection (20 cards)",
        "intermediate": "Complete one village collection (40 cards)", 
        "advanced": "Complete multi-village synergy decks (60+ cards)",
        "master": "Collect all Epic and Legendary cards (9 cards)",
        "grandmaster": "Perfect collection with max upgrades (123 cards × 5 levels)"
    },
    
    "competitive_progression": {
        "seasons": {
            "duration": "3 months",
            "rewards": "Exclusive cards, animated versions, titles",
            "rank_decay": "Prevents stagnation, encourages active play"
        },
        "tournaments": {
            "weekly_clan_wars": "Single clan restriction, rewards clan mastery",
            "monthly_village_wars": "Village-specific tournaments",
            "quarterly_kage_summit": "Global championship with all villages"
        }
    }
}

print("\n" + "="*60)
print("COMPLETE BETA CARD DATABASE - ALL RARITIES")
print("="*60)

print(f"\n🔷 UNCOMMON CARDS (Cost 4-6) - Sample:")
uncommon_df = pd.DataFrame(complete_card_database["uncommon_cards"])
print(uncommon_df[['name', 'village', 'clan', 'cost', 'ability']].head(6).to_string(index=False))

print(f"\n🔶 RARE CARDS (Cost 7-9) - Sample:")
rare_df = pd.DataFrame(complete_card_database["rare_cards"]) 
print(rare_df[['name', 'village', 'cost', 'ability']].head(6).to_string(index=False))

print(f"\n🔴 EPIC CARDS (Cost 10-12):")
epic_df = pd.DataFrame(complete_card_database["epic_cards"])
print(epic_df[['name', 'village', 'cost', 'ability']].to_string(index=False))

print(f"\n⭐ LEGENDARY CARDS (Cost 13-15):")
legendary_df = pd.DataFrame(complete_card_database["legendary_cards"])
print(legendary_df[['name', 'village', 'cost', 'ability']].to_string(index=False))

print(f"\n🎯 STARTER DECK STRATEGIES:")
for deck_name, deck_info in progression_system["starter_decks"].items():
    print(f"\n{deck_name}:")
    print(f"  Focus: {deck_info['focus']}")
    print(f"  Win Condition: {deck_info['win_condition']}")
    print(f"  Key Cards: {', '.join(deck_info['key_cards'])}")
    print(f"  Upgrade Path: {deck_info['upgrade_path']}")

print(f"\n📈 COLLECTION PROGRESSION:")
for goal_level, description in progression_system["collection_goals"].items():
    print(f"  • {goal_level.title()}: {description}")

# Calculate total cards and distribution
all_cards = (len(card_database["common_cards"]) + 
            len(complete_card_database["uncommon_cards"]) +
            len(complete_card_database["rare_cards"]) + 
            len(complete_card_database["epic_cards"]) +
            len(complete_card_database["legendary_cards"]))

print(f"\n📊 FINAL BETA CARD COUNT:")
print(f"  Common: {len(card_database['common_cards'])} cards")
print(f"  Uncommon: {len(complete_card_database['uncommon_cards'])} cards") 
print(f"  Rare: {len(complete_card_database['rare_cards'])} cards")
print(f"  Epic: {len(complete_card_database['epic_cards'])} cards")
print(f"  Legendary: {len(complete_card_database['legendary_cards'])} cards")
print(f"  TOTAL: {all_cards} cards")

print(f"\n🎮 COMPETITIVE BALANCE:")
village_distribution = {"Hidden Flame": 0, "Hidden Mist": 0, "Hidden Forest": 0, "Any": 0}
school_distribution = {"Taijutsu": 0, "Ninjutsu": 0, "Genjutsu": 0, "Equipment": 0, "All": 0}

# Count all cards by village and school
all_card_lists = [card_database["common_cards"], complete_card_database["uncommon_cards"], 
                  complete_card_database["rare_cards"], complete_card_database["epic_cards"],
                  complete_card_database["legendary_cards"]]

for card_list in all_card_lists:
    for card in card_list:
        if card["village"] in village_distribution:
            village_distribution[card["village"]] += 1
        if card["school"] in school_distribution:
            school_distribution[card["school"]] += 1

print("Village Balance:")
for village, count in village_distribution.items():
    print(f"  {village}: {count} cards")

print("School Balance:")  
for school, count in school_distribution.items():
    print(f"  {school}: {count} cards")