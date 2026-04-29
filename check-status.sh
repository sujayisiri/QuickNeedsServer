#!/bin/bash
# List all Lambda functions with their layer information
# Useful for checking current deployment status

REGION="us-east-1"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📊 Lambda Functions Status Report"
echo "=================================="
echo "Region: ${REGION}"
echo ""

# Get all QuickNeeds functions
functions=$(aws lambda list-functions \
  --region ${REGION} \
  --query 'Functions[?starts_with(FunctionName, `quickneeds`)].FunctionName' \
  --output text)

if [ -z "$functions" ]; then
  echo "${RED}No QuickNeeds Lambda functions found!${NC}"
  exit 1
fi

echo "Found $(echo $functions | wc -w | tr -d ' ') functions"
echo ""

# Header
printf "%-30s %-10s %-15s %-20s\n" "Function Name" "Layers" "Runtime" "Last Modified"
echo "─────────────────────────────────────────────────────────────────────────────────"

for func in $functions; do
  # Get function details
  config=$(aws lambda get-function-configuration \
    --function-name ${func} \
    --region ${REGION} 2>/dev/null)
  
  if [ -z "$config" ]; then
    printf "%-30s ${RED}ERROR${NC}\n" "${func}"
    continue
  fi
  
  # Extract info
  layer_count=$(echo "$config" | grep -o "LayerVersionArn" | wc -l | tr -d ' ')
  runtime=$(echo "$config" | grep -o '"Runtime": "[^"]*"' | cut -d'"' -f4)
  last_modified=$(echo "$config" | grep -o '"LastModified": "[^"]*"' | cut -d'"' -f4 | cut -d'T' -f1)
  code_size=$(echo "$config" | grep -o '"CodeSize": [0-9]*' | grep -o '[0-9]*')
  
  # Calculate code size in KB
  if [ ! -z "$code_size" ]; then
    code_size_kb=$((code_size / 1024))
  else
    code_size_kb="?"
  fi
  
  # Color code based on layer count
  if [ "$layer_count" -eq "2" ]; then
    layer_display="${GREEN}${layer_count}${NC}"
  elif [ "$layer_count" -eq "0" ]; then
    layer_display="${RED}${layer_count}${NC}"
  else
    layer_display="${YELLOW}${layer_count}${NC}"
  fi
  
  printf "%-30s ${layer_display}          %-15s %-20s\n" "${func}" "${runtime}" "${last_modified}"
done

echo ""
echo "Legend:"
echo "  ${GREEN}2${NC} = Both layers attached (correct)"
echo "  ${YELLOW}1${NC} = Only one layer attached (incomplete)"
echo "  ${RED}0${NC} = No layers attached (needs update)"
echo ""

# Show layer versions
echo "${BLUE}📦 Available Layer Versions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

core_layers=$(aws lambda list-layer-versions \
  --layer-name quickneeds-core-dependencies \
  --region ${REGION} \
  --max-items 3 \
  --query 'LayerVersions[*].[Version,CreatedDate]' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$core_layers" ]; then
  echo "Core Dependencies:"
  echo "$core_layers" | while read version date; do
    echo "  v${version} - ${date}"
  done
else
  echo "${RED}Core layer not found${NC}"
fi

echo ""

firebase_layers=$(aws lambda list-layer-versions \
  --layer-name quickneeds-firebase-dependencies \
  --region ${REGION} \
  --max-items 3 \
  --query 'LayerVersions[*].[Version,CreatedDate]' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$firebase_layers" ]; then
  echo "Firebase Dependencies:"
  echo "$firebase_layers" | while read version date; do
    echo "  v${version} - ${date}"
  done
else
  echo "${RED}Firebase layer not found${NC}"
fi

echo ""

# Count summary
total=$(echo $functions | wc -w | tr -d ' ')
with_layers=0
without_layers=0

for func in $functions; do
  layer_count=$(aws lambda get-function-configuration \
    --function-name ${func} \
    --region ${REGION} \
    --query 'length(Layers)' \
    --output text 2>/dev/null || echo "0")
  
  if [ "$layer_count" -eq "2" ]; then
    ((with_layers++))
  else
    ((without_layers++))
  fi
done

echo "${BLUE}📈 Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total functions: ${total}"
echo "${GREEN}With 2 layers: ${with_layers}${NC}"
if [ $without_layers -gt 0 ]; then
  echo "${YELLOW}Missing layers: ${without_layers}${NC}"
  echo ""
  echo "💡 Run ./attach-layers.sh to fix"
fi
echo ""
