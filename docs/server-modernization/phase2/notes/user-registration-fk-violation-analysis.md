# ユーザー登録時 FK 違反問題の詳細分析

## RUN_ID

`20251119T220900Z`（RuntimeException検証）

## 問題概要

サーバー再構築後の初期ユーザー登録（`POST /openDolphin/resources/user`）で以下のエラーが発生:

```
PSQLException: ERROR: insert or update on table "d_roles" violates foreign key constraint "fk_roles_user"
Detail: Key (c_user)=(302) is not present in table "d_users".
```

### 症状

- `UserModel` がデータベースに保存される前に `RoleModel` の挿入が試みられる
- `SystemServiceBean.addFacilityAdmin` では同様のパターンで成功している
- admin ユーザーは正常に登録できるが、doctor ユーザー登録時にエラー発生

## 試行した修正とその結果

### 修正1: SystemServiceBeanパターンの適用

**内容**: `UserServiceBean.addUser` で role を detach → `em.persist(user)` → `em.flush()` → role を re-attach & persist

**結果**: ❌ FK violation が継続

**コード**:
```java
// UserServiceBean.java (line 77-95)
List<RoleModel> roles = add.getRoles();
add.setRoles(null);

em.persist(add);
em.flush();

if (roles != null) {
    add.setRoles(roles);
    for (RoleModel role : roles) {
        role.setUserModel(add);
        role.setUserId(add.getUserId());
        em.persist(role);
    }
}
```

### 修正2: em.merge() への変更

**内容**: `em.persist(add)` を `add = em.merge(add)` に変更

**結果**: ❌ FK violation が継続

**理由**: detached entity の merge は成功するが、UserModel がデータベースに実際に INSERT されていない可能性

### 修正3: RoleModelへのuserId明示設定

**内容**: `UserResource.addUser` で `RoleModel` に `userId` と `userModel` を明示的に設定

**結果**: ❌ FK violation が継続

**コード**:
```java
// UserResource.java (line 107-110)
for (RoleModel role : roles) {
    role.setUserModel(model);
    role.setUserId(model.getUserId());
}
```

## RuntimeException検証（RUN_ID=20251119T220900Z）

### 目的

デプロイされたコードが実際に実行されているかを確認

### 実施内容

`UserServiceBean.addUser` の先頭に以下を挿入:

```java
public int addUser(UserModel add) {
    throw new RuntimeException("DEBUG: UserServiceBean.addUser called! If you see this, the code is updated.");
    // ... 
}
```

### 結果

✅ RuntimeException が正常に発生し、スタックトレースに以下が含まれることを確認:

```
Caused by: java.lang.RuntimeException: DEBUG: UserServiceBean.addUser called! If you see this, the code is updated.
    at deployment.opendolphin-server.war//open.dolphin.session.UserServiceBean.addUser(UserServiceBean.java:62)
```

### 結論

- デプロイされたコードは確実に実行されている
- 以前の修正が効果がないのは、コードの問題ではなく JPA/Hibernate の動作に起因する

## SystemServiceBean との比較

### SystemServiceBean.addFacilityAdmin（成功）

```java
// line 86-100
List<RoleModel> roles = admin.getRoles();
admin.setRoles(null);

em.persist(admin);
em.flush();

admin.setRoles(roles);
for (RoleModel role : roles) {
    role.setUserModel(admin);
    em.persist(role);
}
```

### UserServiceBean.addUser（失敗）

```java
// line 77-95
List<RoleModel> roles = add.getRoles();
add.setRoles(null);

add = em.merge(add);  // ← persist ではなく merge
em.flush();

if (roles != null) {
    add.setRoles(roles);
    for (RoleModel role : roles) {
        role.setUserModel(add);
        role.setUserId(add.getUserId());  // ← 追加設定
        em.persist(role);
    }
}
```

### 主な違い

| 項目 | SystemServiceBean | UserServiceBean |
|------|-------------------|-----------------|
| UserModel の CASCADE 設定 | なし | `@OneToMany(cascade=CascadeType.ALL, fetch=FetchType.EAGER)` |
| persist/merge | `em.persist()` | `em.merge()` |
| userId 設定 | なし | あり |

## 根本原因の候補

### 1. CASCADE=ALL の影響

`UserModel` の `roles` フィールド:

```java
@OneToMany(mappedBy="user", cascade=CascadeType.ALL, fetch=FetchType.EAGER)
private List<RoleModel> roles;
```

**問題点**:
- `CascadeType.ALL` により、`em.merge()` 時に roles も cascade 処理される
- detach した roles がメモリ上に残っている場合、merge で再度関連付けられる可能性
- `em.flush()` より前に cascade INSERT が試みられる可能性

### 2. EAGER Fetch の影響

**問題点**:
- `FetchType.EAGER` により、UserModel 読み込み時に roles も即座に取得される
- merge や flush 時に予期しないタイミングで roles が処理される可能性
- persistence context の状態管理が複雑化

### 3. em.merge() vs em.persist()

**em.persist()**:
- 新規エンティティ専用
- 即座に persistence context に追加
- CASCADE がある場合、関連エンティティも即座に persist

**em.merge()**:
- detached entity を再 attach
- 新規 or 既存を判定してマージ
- CASCADE がある場合、関連エンティティの状態も merge

**問題**: `em.merge()` + `CASCADE=ALL` の組み合わせにより、detach した roles が予期せず処理される可能性

## 推奨解決策

### Option 1: CASCADE 無効化（最も確実）

`common/src/main/java/open/dolphin/infomodel/UserModel.java` を修正:

```java
@OneToMany(mappedBy="user", fetch=FetchType.EAGER)
private List<RoleModel> roles;
```

**メリット**:
- CASCADE による予期しない動作を排除
- SystemServiceBean と同じ動作パターンになる

**デメリット**:
- 既存の CASCADE 依存コードがある場合、影響調査が必要

### Option 2: em.persist() への戻し

`UserServiceBean.addUser` で `em.merge()` を `em.persist()` に変更:

```java
em.persist(add);  // merge から persist へ
em.flush();
```

**メリット**:
- SystemServiceBean と完全に同じパターン

**デメリット**:
- 新規ユーザーの場合のみ有効
- detached entity の場合は使用不可

### Option 3: トランザクション境界の変更

```java
@Transactional(Transactional.TxType.REQUIRES_NEW)
public int addUser(UserModel add) {
    // ...
}
```

**メリット**:
- 新規トランザクションで隔離される

**デメリット**:
- 既存のトランザクション管理に影響する可能性

## 次のアクション

1. **Option 1を試す**: `common/src/main/java/open/dolphin/infomodel/UserModel.java` から `cascade=CascadeType.ALL` を削除
2. **影響調査**: CASCADE に依存している既存コードがないかを確認
3. **検証**: doctor ユーザー登録が成功することを確認
4. **証跡**: `artifacts/parity-manual/user-registration/<new RUN_ID>/` に結果を保存
5. **ドキュメント更新**: `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` と `PHASE2_PROGRESS.md` を更新

## 関連ファイル

- `common/src/main/java/open/dolphin/infomodel/UserModel.java` (line 57-58)
- `common/src/main/java/open/dolphin/infomodel/RoleModel.java` (line 23-25)
- `server-modernized/src/main/java/open/dolphin/session/UserServiceBean.java` (line 61-96)
- `server-modernized/src/main/java/open/dolphin/session/SystemServiceBean.java` (line 86-102)
- `server-modernized/src/main/java/open/dolphin/rest/UserResource.java` (line 104-110)

## 証跡保存先

- RuntimeException 検証: `artifacts/parity-manual/user-registration/20251119T220900Z/`
  - docker logs
  - curl レスポンス
  - コード diff
