import plotly.graph_objects as go
import plotly.express as px
import json

# Parse the tournament data
tournament_data = {"tournament_structure": {"qualification": {"regions": ["Americas", "Europe", "Asia-Pacific"], "players_per_region": 64, "qualifiers_per_region": 16}, "group_stage": {"total_players": 48, "groups": 12, "players_per_group": 4, "format": "Dual Tournament", "advancement": 2}, "playoffs": {"total_players": 24, "format": "Single Elimination", "rounds": ["Round of 24", "Round of 16", "Quarterfinals", "Semifinals", "Finals"]}, "prize_pool": {"total": 1000000, "champion": 250000, "runner_up": 150000, "third_fourth": 75000, "fifth_eighth": 50000, "ninth_sixteenth": 25000}}}

# Create tournament bracket visualization
fig = go.Figure()

# Define colors from the theme
colors = ['#1FB8CD', '#DB4545', '#2E8B57', '#5D878F', '#D2BA4C']

# Qualification Phase - 3 regions at the top (larger boxes)
regions = ["Americas", "Europe", "Asia-Pacific"]
for i, region in enumerate(regions):
    fig.add_shape(
        type="rect",
        x0=i*4, y0=10, x1=i*4+3.5, y1=11.5,
        fillcolor=colors[0],
        line=dict(color="black", width=2),
        opacity=0.9
    )
    fig.add_annotation(
        x=i*4+1.75, y=10.75,
        text=f"<b>{region}</b><br/>64 Players<br/>→ Top 16",
        showarrow=False,
        font=dict(size=12, color="white"),
        bgcolor=colors[0],
        bordercolor="black",
        borderwidth=1
    )

# Group Stage (larger box)
fig.add_shape(
    type="rect",
    x0=4, y0=8, x1=8, y1=9.5,
    fillcolor=colors[2],
    line=dict(color="black", width=2),
    opacity=0.9
)
fig.add_annotation(
    x=6, y=8.75,
    text="<b>Group Stage</b><br/>48 Players, 12 Groups of 4<br/>Dual Tournament Format<br/>Top 2 from each → Playoffs",
    showarrow=False,
    font=dict(size=12, color="white"),
    bgcolor=colors[2],
    bordercolor="black",
    borderwidth=1
)

# Playoffs - bracket style layout
playoff_stages = [
    {"name": "Round of 24", "players": 24, "prize": "$25k (9th-16th)", "x": 2, "y": 6},
    {"name": "Round of 16", "players": 16, "prize": "$25k (9th-16th)", "x": 5, "y": 6},
    {"name": "Quarterfinals", "players": 8, "prize": "$50k (5th-8th)", "x": 8, "y": 6},
    {"name": "Semifinals", "players": 4, "prize": "$75k (3rd-4th)", "x": 11, "y": 6},
    {"name": "Finals", "players": 2, "prize": "Winner: $250k | Runner-up: $150k", "x": 14, "y": 6}
]

for i, stage in enumerate(playoff_stages):
    color_idx = (i + 1) % len(colors)
    width = 3.5 if stage["name"] != "Finals" else 4.5
    
    fig.add_shape(
        type="rect",
        x0=stage["x"], y0=stage["y"], x1=stage["x"]+width, y1=stage["y"]+1.5,
        fillcolor=colors[color_idx],
        line=dict(color="black", width=2),
        opacity=0.9
    )
    
    text = f"<b>{stage['name']}</b><br/>{stage['players']} Players<br/>{stage['prize']}"
    
    fig.add_annotation(
        x=stage["x"]+width/2, y=stage["y"]+0.75,
        text=text,
        showarrow=False,
        font=dict(size=11, color="white"),
        bgcolor=colors[color_idx],
        bordercolor="black",
        borderwidth=1
    )

# Prize Pool Info (larger and more prominent)
fig.add_shape(
    type="rect",
    x0=7, y0=3.5, x1=11, y1=5,
    fillcolor=colors[1],
    line=dict(color="black", width=3),
    opacity=0.9
)
fig.add_annotation(
    x=9, y=4.25,
    text="<b>TOTAL PRIZE POOL</b><br/><b>$1,000,000 USD</b>",
    showarrow=False,
    font=dict(size=14, color="white", family="Arial Black"),
    bgcolor=colors[1],
    bordercolor="black",
    borderwidth=2
)

# Add connecting arrows with better flow
# From regions to group stage
for i in range(3):
    fig.add_annotation(
        ax=i*4+1.75, ay=10,
        x=6, y=9.5,
        arrowhead=2,
        arrowsize=1.5,
        arrowwidth=3,
        arrowcolor="black"
    )

# From group stage to first playoff round
fig.add_annotation(
    ax=6, ay=8,
    x=3.75, y=7.5,
    arrowhead=2,
    arrowsize=1.5,
    arrowwidth=3,
    arrowcolor="black"
)

# Between playoff rounds (horizontal arrows)
for i in range(len(playoff_stages)-1):
    start_x = playoff_stages[i]["x"] + (3.5 if playoff_stages[i]["name"] != "Finals" else 4.5)
    end_x = playoff_stages[i+1]["x"]
    
    fig.add_annotation(
        ax=start_x, ay=6.75,
        x=end_x, y=6.75,
        arrowhead=2,
        arrowsize=1.5,
        arrowwidth=3,
        arrowcolor="black"
    )

# From prize pool to finals
fig.add_annotation(
    ax=11, ay=4.25,
    x=14, y=6,
    arrowhead=2,
    arrowsize=1.5,
    arrowwidth=3,
    arrowcolor=colors[1]
)

# Add legend/key
legend_items = [
    {"color": colors[0], "text": "Regional Qualifiers", "x": 1, "y": 2},
    {"color": colors[2], "text": "Group Stage", "x": 4, "y": 2},
    {"color": colors[3], "text": "Playoffs", "x": 7, "y": 2},
    {"color": colors[1], "text": "Prize Pool", "x": 10, "y": 2}
]

for item in legend_items:
    fig.add_shape(
        type="rect",
        x0=item["x"], y0=item["y"], x1=item["x"]+0.5, y1=item["y"]+0.3,
        fillcolor=item["color"],
        line=dict(color="black", width=1),
        opacity=0.9
    )
    fig.add_annotation(
        x=item["x"]+0.8, y=item["y"]+0.15,
        text=item["text"],
        showarrow=False,
        font=dict(size=10, color="black"),
        xanchor="left"
    )

# Update layout
fig.update_layout(
    title=dict(
        text="<b>Ninja Clan Wars Championship</b><br/><i>Tournament Structure & Prize Distribution</i>",
        x=0.5,
        font=dict(size=20, color="black")
    ),
    showlegend=False,
    xaxis=dict(
        showgrid=False,
        showticklabels=False,
        zeroline=False,
        range=[-1, 20]
    ),
    yaxis=dict(
        showgrid=False,
        showticklabels=False,
        zeroline=False,
        range=[1, 12]
    ),
    plot_bgcolor='rgba(0,0,0,0)',
    paper_bgcolor='rgba(248,248,248,1)'
)

# Save the chart
fig.write_image("tournament_bracket.png")
fig.write_image("tournament_bracket.svg", format="svg")

print("Enhanced tournament bracket saved successfully!")