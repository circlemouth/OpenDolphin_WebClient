#!/bin/bash
# Test script for pre-push hook

echo "=== Testing pre-push hook ==="
echo ""

# Simulate what git push sends to the hook
# Format: <local ref> <local sha> <remote ref> <remote sha>
echo "refs/heads/master $(git rev-parse HEAD) refs/heads/master $(git rev-parse origin/master 2>/dev/null || echo '0000000000000000000000000000000000000000')" | .git/hooks/pre-push origin https://github.com/yourrepo

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test FAILED: Hook should have blocked the push!"
    exit 1
else
    echo ""
    echo "✅ Test PASSED: Hook correctly blocked the push of sensitive files!"
    exit 0
fi
